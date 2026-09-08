"""Celery application for background CVE monitoring tasks."""
from celery import Celery
import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# `include` imports the task modules on worker start. autodiscover_tasks() would
# only look for a `tasks.py` in each package, which this project does not use, so
# the scheduled tasks would never be registered.
celery_app = Celery(
    "cve_explorer",
    broker=redis_url,
    backend=redis_url,
    include=["app.workers.monitor"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Don't let a wedged upstream call block a worker slot forever.
    task_soft_time_limit=600,
    task_time_limit=900,
)

from .scheduler import beat_schedule

celery_app.conf.beat_schedule = beat_schedule

# Import the task module eagerly so the registry is populated for anything that
# inspects it (health checks, tests, `celery inspect registered`) and not only in
# the worker bootstrap that processes `include`.
from . import monitor  # noqa: E402,F401  (import for task registration side effect)
