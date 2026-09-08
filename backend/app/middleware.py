"""Request context middleware: request IDs and structured access logging."""
import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("cve_explorer.access")

REQUEST_ID_HEADER = "X-Request-ID"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assigns an X-Request-ID per request and logs one access line on completion."""

    async def dispatch(self, request: Request, call_next):
        # Always generate our own request ID — never trust client-supplied values
        request_id = uuid.uuid4().hex[:16]
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        response.headers[REQUEST_ID_HEADER] = request_id

        logger.info(
            "request_id=%s method=%s path=%s status=%d duration_ms=%.1f ip=%s",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request.client.host if request.client else "-",
        )
        return response
