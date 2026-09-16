"""Background worker for continuous CVE monitoring."""
import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from celery import shared_task
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./cve_explorer.db")


def _disposable_session():
    """Return an (async_sessionmaker, engine) pair bound to a fresh engine.

    Engines are created per task and disposed when the task finishes so pooled
    connections are never reused across asyncio event loops in celery prefork
    workers (asyncpg crashes on cross-loop reuse).
    """
    engine = create_async_engine(DATABASE_URL)
    return async_sessionmaker(engine, expire_on_commit=False), engine


@shared_task(name="workers.check_new_kev", bind=True, max_retries=5, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def check_new_kev(self):
    """Check CISA KEV for new entries and generate alerts."""
    asyncio.run(_check_new_kev_async())


async def _check_new_kev_async():
    from ..services.cve_service import fetch_kev_catalog
    from ..models.kev import KevEntry
    from ..models.alert import Alert

    kev_catalog = await fetch_kev_catalog()

    AsyncSessionLocal, engine = _disposable_session()
    try:
        async with AsyncSessionLocal() as db:
            existing = set(
                row[0] for row in (
                    await db.execute(select(KevEntry.cve_id))
                ).all()
            )
            new_count = 0
            for cve_id, entry in kev_catalog.items():
                if cve_id not in existing:
                    db.add(KevEntry(
                        cve_id=cve_id,
                        vendor=entry.get("vendorProject"),
                        product=entry.get("product"),
                        vulnerability_name=entry.get("vulnerabilityName"),
                        date_added=entry.get("dateAdded"),
                        short_description=entry.get("shortDescription"),
                        required_action=entry.get("requiredAction"),
                        due_date=entry.get("dueDate"),
                        known_ransomware_campaign_use=entry.get("knownRansomwareCampaignUse"),
                        notes=entry.get("notes"),
                    ))
                    db.add(Alert(
                        alert_type="kev_update",
                        title=f"CVE {cve_id} added to CISA KEV",
                        message=f"{entry.get('vendorProject', 'Unknown')} {entry.get('product', '')} — Due: {entry.get('dueDate', 'N/A')}",
                        severity="critical",
                        cve_id=cve_id,
                        source="CISA KEV",
                    ))
                    new_count += 1
            await db.commit()
            logger.info("KEV check complete: %d new entries found", new_count)
    except Exception:
        logger.exception("KEV check failed")
        raise
    finally:
        await engine.dispose()


@shared_task(name="workers.check_epss_changes", bind=True, max_retries=5, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def check_epss_changes(self):
    """Check for significant EPSS score changes."""
    asyncio.run(_check_epss_changes_async())


async def _check_epss_changes_async():
    from ..services.cve_service import fetch_epss_score
    from ..models.epss import EpssScore
    from ..models.alert import Alert

    AsyncSessionLocal, engine = _disposable_session()
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(EpssScore).where(EpssScore.score >= 0.3).order_by(EpssScore.score.desc()).limit(50)
            )
            alerts_created = 0
            for epss_row in result.scalars().all():
                fresh = await fetch_epss_score(epss_row.cve_id)
                if fresh and fresh.get("score", 0) >= 0.7:
                    old_prob = epss_row.score or 0
                    new_prob = fresh["score"]
                    if new_prob > old_prob * 1.2:
                        db.add(Alert(
                            alert_type="epss_increase",
                            title=f"CVE {epss_row.cve_id} EPSS increased to {new_prob*100:.0f}%",
                            message=f"Probability rose from {old_prob*100:.0f}% to {new_prob*100:.0f}%",
                            severity="critical" if new_prob >= 0.7 else "high",
                            cve_id=epss_row.cve_id,
                            source="EPSS",
                        ))
                        alerts_created += 1
                    epss_row.score = new_prob
                    epss_row.percentile = fresh.get("percentile")
                    epss_row.calculated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            await db.commit()
            logger.info("EPSS check complete: %d alerts created", alerts_created)
    except Exception:
        logger.exception("EPSS check failed")
        raise
    finally:
        await engine.dispose()


@shared_task(name="workers.refresh_cve_cache", bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=120, retry_jitter=True)
def refresh_cve_cache(self):
    """Refresh stale CVE data from APIs."""
    asyncio.run(_refresh_cve_cache_async())


async def _refresh_cve_cache_async():
    from ..services.cve_service import get_or_create_cve
    from ..models.cve import CVE

    AsyncSessionLocal, engine = _disposable_session()
    try:
        async with AsyncSessionLocal() as db:
            cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
            result = await db.execute(
                select(CVE).where(CVE.updated_at < cutoff).order_by(CVE.updated_at.asc()).limit(10)
            )
            refreshed = 0
            failed = 0
            for cve in result.scalars().all():
                try:
                    await get_or_create_cve(db, cve.cve_id)
                    refreshed += 1
                except Exception:
                    logger.warning("Failed to refresh CVE %s", cve.cve_id, exc_info=True)
                    failed += 1
            logger.info("CVE cache refresh complete: %d refreshed, %d failed", refreshed, failed)
    except Exception:
        logger.exception("CVE cache refresh failed")
        raise
    finally:
        await engine.dispose()
