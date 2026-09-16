"""CVE Explorer API - FastAPI Application."""
import logging
import logging.config
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, encoders
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .config import get_settings
from .database import engine, Base
from .middleware import RequestContextMiddleware
from .rate_limit import limiter
from .api import cve, remediation, alerts, analytics

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


settings = get_settings()


def _configure_logging() -> None:
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": settings.LOG_LEVEL,
            "handlers": ["console"],
        },
        "loggers": {
            "uvicorn.access": {
                "level": settings.LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False,
            },
            "cve_explorer": {
                "level": settings.LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False,
            },
            "httpx": {
                "level": "WARNING",
                "handlers": ["console"],
                "propagate": False,
            },
        },
    })


_configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is owned by Alembic migrations in production.
    # create_all is kept for fast local/dev bootstrap only.
    if not settings.is_production and settings.is_sqlite:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    version=settings.APP_VERSION,
    description="Vulnerability intelligence platform with risk scoring, EPSS/KEV enrichment, and remediation tracking.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)

# Rate limiting state
app.state.limiter = limiter
limiter.enabled = not settings.DEBUG


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "-")
    return JSONResponse(
        status_code=422,
        content={
            "detail": encoders.jsonable_encoder(exc.errors()),
            "request_id": request_id,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "-")
    logging.getLogger("cve_explorer").exception(
        "Unhandled error request_id=%s path=%s", request_id, request.url.path, exc_info=exc
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error.",
            "request_id": request_id,
        },
    )


@app.get("/api/health")
async def health(request: Request):
    request_id = getattr(request.state, "request_id", "-")
    db_ok = True
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    payload = {
        "status": "ok" if db_ok else "degraded",
        "version": settings.APP_VERSION,
        "env": settings.APP_ENV,
        "database": "up" if db_ok else "down",
        "request_id": request_id,
    }
    if not db_ok:
        return JSONResponse(status_code=503, content=payload)
    return payload


app.include_router(cve.router)
app.include_router(remediation.router)
app.include_router(alerts.router)
app.include_router(analytics.router)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)