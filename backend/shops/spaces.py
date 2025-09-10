import os
import mimetypes
import uuid
from urllib.parse import urlparse

import boto3
from botocore.config import Config


class SpacesConfigError(RuntimeError):
    pass


def _get_env(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default)
    if val is None:
        raise SpacesConfigError(f"Missing required env var: {name}")
    return val


def _public_base_url(endpoint_url: str, bucket: str) -> str:
    # Prefer explicit public base URL if provided (e.g., CDN domain)
    explicit = os.environ.get("SPACES_PUBLIC_BASE_URL")
    if explicit:
        return explicit.rstrip("/")
    # Derive from endpoint like https://nyc3.digitaloceanspaces.com -> https://{bucket}.nyc3.digitaloceanspaces.com
    parsed = urlparse(endpoint_url)
    host = parsed.netloc
    scheme = parsed.scheme or "https"
    return f"{scheme}://{bucket}.{host}"


def _client():
    endpoint_url = _get_env("SPACES_ENDPOINT_URL")
    access_key = _get_env("SPACES_ACCESS_KEY_ID")
    secret_key = _get_env("SPACES_SECRET_ACCESS_KEY")
    # Using path-style addressing off; virtual hosted-style works with DO Spaces
    session = boto3.session.Session()
    return session.client(
        "s3",
        region_name=os.environ.get("SPACES_REGION", None),
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(s3={"addressing_style": "virtual"}),
    )


def generate_product_image_key(root_folder: str, filename: str) -> str:
    root = root_folder.strip("/")
    # Preserve extension if any
    ext = ""
    if "." in filename:
        ext = filename[filename.rfind(".") :].lower()
    unique = uuid.uuid4().hex
    return f"{root}/product_images/{unique}{ext}"


def upload_product_image(file_obj, original_name: str) -> str:
    """
    Uploads given file-like object to Spaces and returns the public URL.
    Path format: {SPACES_ROOT_FOLDER}/product_images/{generated_name}
    """
    bucket = _get_env("SPACES_BUCKET_NAME")
    endpoint_url = _get_env("SPACES_ENDPOINT_URL")
    root_folder = _get_env("SPACES_ROOT_FOLDER", "uploads")

    key = generate_product_image_key(root_folder, original_name or "image")
    content_type = mimetypes.guess_type(original_name or "")[0] or "application/octet-stream"

    client = _client()
    # Upload with public-read ACL so the URL is directly accessible
    client.upload_fileobj(
        Fileobj=file_obj,
        Bucket=bucket,
        Key=key,
        ExtraArgs={
            "ACL": "public-read",
            "ContentType": content_type,
            # Cache for 1 day by default; tune if needed
            "CacheControl": os.environ.get("SPACES_CACHE_CONTROL", "public, max-age=86400"),
        },
    )

    base_url = _public_base_url(endpoint_url, bucket)
    return f"{base_url}/{key}"


def _key_from_url(url: str) -> str | None:
    try:
        bucket = _get_env("SPACES_BUCKET_NAME")
        endpoint_url = _get_env("SPACES_ENDPOINT_URL")
        base_candidates = []
        pub = os.environ.get("SPACES_PUBLIC_BASE_URL")
        if pub:
            base_candidates.append(pub.rstrip("/"))
        base_candidates.append(_public_base_url(endpoint_url, bucket))
        for base in base_candidates:
            if url.startswith(base + "/"):
                return url[len(base) + 1 :]
    except Exception:
        return None
    return None


def delete_product_image_by_url(url: str) -> None:
    """Best-effort delete of an object in Spaces given its public URL."""
    key = _key_from_url(url)
    if not key:
        return
    bucket = _get_env("SPACES_BUCKET_NAME")
    client = _client()
    try:
        client.delete_object(Bucket=bucket, Key=key)
    except Exception:
        # Ignore errors to keep API idempotent
        pass
