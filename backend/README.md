Backend (Django + DRF)

Features
- Django project with DRF, CORS, TokenAuth
- Custom `users` app with registration, login, logout, and current user endpoints
- Postgres configuration via environment variables

Requirements
- Python 3.11+
- Postgres 13+

DigitalOcean Spaces
- Configure Spaces in `.env` (root or backend):
  - `SPACES_ENDPOINT_URL` e.g. `https://nyc3.digitaloceanspaces.com`
  - `SPACES_BUCKET_NAME`, `SPACES_ACCESS_KEY_ID`, `SPACES_SECRET_ACCESS_KEY`
  - Optional: `SPACES_REGION`, `SPACES_PUBLIC_BASE_URL` (CDN), `SPACES_CACHE_CONTROL`
  - `SPACES_ROOT_FOLDER` root folder for uploads (default `uploads`). Images upload to `{SPACES_ROOT_FOLDER}/product_images/{generated_name}`.

Product Image Upload API
- POST `/api/v1/shops/<shop_id>/products/<product_id>/images/upload/`
  - Auth: Token required
  - Content-Type: `multipart/form-data`
  - Fields:
    - `file` (or `image`): the image file
    - `alt_text` (optional)
  - Response: created `ProductImage` JSON with `url`, `alt_text`, etc.

Environment
- Copy `.env.example` to `.env` (root or export env vars in shell).
- Required vars: `DJANGO_SECRET_KEY`, `POSTGRES_*`, `ALLOWED_HOSTS`, `FRONTEND_URL`, `DJANGO_DEBUG`.

Install
1) Create venv and install deps:
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`  # includes `boto3` for Spaces

2) Prepare database and migrate:
   - Ensure Postgres is running and credentials match env vars
   - `python manage.py makemigrations`
   - `python manage.py migrate`

3) Run dev server:
   - `python manage.py runserver 0.0.0.0:8000`

API Base
- Default base URL: `http://localhost:8000`
- Auth endpoints (Token auth):
  - POST `/api/v1/auth/register/` — {username, email, password}
  - POST `/api/v1/auth/login/` — {identifier, password} where identifier is username or email
  - POST `/api/v1/auth/logout/` — header `Authorization: Token <token>`
  - GET  `/api/v1/auth/me/` — header `Authorization: Token <token>`

Production Notes
- Prefer httpOnly, secure cookies (JWT or session) and enforce CSRF.
- Restrict `ALLOWED_HOSTS`, configure `CORS_ALLOWED_ORIGINS`, and set `DJANGO_DEBUG=False`.
- Rotate `DJANGO_SECRET_KEY` and store secrets securely.
