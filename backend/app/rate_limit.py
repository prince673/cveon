"""SlowAPI rate limiting shared instance."""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_client_ip(request):
    """Extract client IP from X-Forwarded-For (set by nginx), falling back to direct IP.

    Only trusts the first hop (nginx) — rejects spoofed multi-hop values.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take only the first IP (the one nginx set) — ignore any client-supplied extras
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_get_client_ip, enabled=None)
