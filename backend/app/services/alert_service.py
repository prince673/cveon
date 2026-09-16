"""Alert management service."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models.alert import Alert


async def get_alerts(
    db: AsyncSession,
    unread_only: bool = False,
    alert_type: str | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[Alert], int]:
    """Fetch alerts with optional filters, pagination, and total count."""
    base_query = select(Alert)
    if unread_only:
        base_query = base_query.where(Alert.read == False)
    if alert_type:
        base_query = base_query.where(Alert.alert_type == alert_type)

    # Total count
    count_q = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginated results
    query = base_query.order_by(Alert.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_unread_count(db: AsyncSession) -> int:
    """Count unread alerts."""
    result = await db.execute(
        select(func.count()).select_from(Alert).where(Alert.read == False)
    )
    return result.scalar() or 0


async def mark_read(db: AsyncSession, alert_id: int) -> bool:
    """Mark a single alert as read. Returns True if found."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return False
    alert.read = True
    await db.commit()
    return True


async def mark_all_read(db: AsyncSession) -> int:
    """Mark all alerts as read. Returns count of updated alerts."""
    result = await db.execute(select(Alert).where(Alert.read == False))
    alerts = result.scalars().all()
    for alert in alerts:
        alert.read = True
    await db.commit()
    return len(alerts)


async def acknowledge_alert(db: AsyncSession, alert_id: int) -> bool:
    """Acknowledge a single alert. Returns True if found."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return False
    alert.acknowledged = True
    await db.commit()
    return True
