"""API-key authentication for state-changing endpoints.

Auth is opt-in: if ``API_KEYS`` is empty the dependency is a no-op, so local
development and read-only deployments keep working unchanged. Set
``API_KEYS=key1,key2`` in the environment to protect write endpoints.

SECURITY NOTE: When used with a frontend SPA, the API key is embedded in the
JavaScript bundle (VITE_API_KEY) and is visible to any page visitor. This
provides rate-limit-level protection against casual abuse, NOT real security.
For true write protection, use per-user/session authentication on the backend.

Clients authenticate with either header:

    X-API-Key: <key>
    Authorization: Bearer <key>
"""
import hmac
import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import APIKeyHeader

from .config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

API_KEY_HEADER = "X-API-Key"

# auto_error=False so a missing header reaches our handler and we can also
# accept the Authorization: Bearer form.
_api_key_header = APIKeyHeader(name=API_KEY_HEADER, auto_error=False)


def _extract_key(request: Request, header_key: str | None) -> str | None:
    if header_key:
        return header_key.strip()
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() == "bearer" and token.strip():
        return token.strip()
    return None


def _key_is_valid(candidate: str) -> bool:
    """Constant-time comparison against every configured key."""
    return any(hmac.compare_digest(candidate, valid) for valid in settings.api_keys)


async def require_api_key(
    request: Request,
    header_key: str | None = Depends(_api_key_header),
) -> None:
    """Reject the request unless a valid API key is supplied.

    In production (APP_ENV=production), missing API_KEYS is a startup error.
    In development, auth is a no-op for convenience.
    """
    if not settings.auth_enabled:
        if settings.is_production:
            logger.error("API_KEYS not configured in production — write endpoints are OPEN")
        return

    candidate = _extract_key(request, header_key)
    request_id = getattr(request.state, "request_id", "-")

    if not candidate:
        logger.warning("request_id=%s missing API key for %s %s",
                       request_id, request.method, request.url.path)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing API key. Send it in the {API_KEY_HEADER} header.",
            headers={"WWW-Authenticate": API_KEY_HEADER},
        )

    if not _key_is_valid(candidate):
        logger.warning("request_id=%s invalid API key for %s %s",
                       request_id, request.method, request.url.path)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key.",
        )
