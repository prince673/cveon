#!/bin/sh
# Production container entrypoint: wait for the database, apply migrations,
# then start the ASGI server.
set -e

# Wait for the database to accept connections before migrating. Compose
# healthchecks usually cover this, but a cold start or a restarted db can still
# race the migration step.
python -u <<'PY'
import os
import sys
import time
from urllib.parse import urlparse

url = os.getenv("DATABASE_URL", "")
if url.startswith("sqlite"):
    sys.exit(0)

parsed = urlparse(url)
host = parsed.hostname or "localhost"
port = parsed.port or 5432

import socket

deadline = time.time() + 60
while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=3):
            print(f"[entrypoint] database reachable at {host}:{port}")
            sys.exit(0)
    except OSError:
        print(f"[entrypoint] waiting for database at {host}:{port} ...")
        time.sleep(2)

print(f"[entrypoint] ERROR: database at {host}:{port} not reachable after 60s", file=sys.stderr)
sys.exit(1)
PY

# Only the web service owns the schema. Workers must not race it.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[entrypoint] Applying database migrations..."
    alembic upgrade head
else
    echo "[entrypoint] RUN_MIGRATIONS=false — skipping migrations"
fi

# Any command passed to the container (celery worker, celery beat, shell, ...)
# runs instead of the API server. This lets worker/beat reuse this image.
if [ "$#" -gt 0 ]; then
    echo "[entrypoint] Executing: $*"
    exec "$@"
fi

echo "[entrypoint] Starting application (env=${APP_ENV:-development}, workers=${WEB_CONCURRENCY:-2})..."
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers "${WEB_CONCURRENCY:-2}" \
    --bind 0.0.0.0:8000 \
    --forwarded-allow-ips='127.0.0.1,172.16.0.0/12,10.0.0.0/8' \
    --access-logfile - \
    --error-logfile -
