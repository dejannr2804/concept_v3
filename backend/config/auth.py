import os
from typing import Optional, Tuple

from django.contrib.auth.models import AnonymousUser
from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework.request import Request
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authtoken.models import Token


class CookieTokenAuthentication(TokenAuthentication):
    """
    Extends DRF TokenAuthentication to also accept a token provided via
    an httpOnly cookie. This enables frontend apps to authenticate
    using cookies without exposing tokens to JavaScript.

    Header format remains supported: Authorization: Token <key>
    Cookie name defaults to 'auth_token' but can be overridden via AUTH_COOKIE env var.
    """

    def authenticate(self, request: Request) -> Optional[Tuple[object, Token]]:
        # First, try the standard Authorization header path
        auth = get_authorization_header(request).split()
        if auth and auth[0].lower() == self.keyword.lower().encode():
            return super().authenticate(request)

        # Fallback: try cookie
        cookie_name = os.environ.get("AUTH_COOKIE", "auth_token")
        token_key = request.COOKIES.get(cookie_name)
        if not token_key:
            return None

        try:
            token = Token.objects.select_related("user").get(key=token_key)
        except Token.DoesNotExist:
            raise AuthenticationFailed("Invalid token")

        user = token.user
        if not user or isinstance(user, AnonymousUser):
            raise AuthenticationFailed("Invalid user")
        return (user, token)

