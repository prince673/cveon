"""CVE lookup and intelligence routes."""
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException, Path, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db, AsyncSessionLocal
from ..config import get_settings
from ..rate_limit import limiter
from ..services.cve_service import get_or_create_cve, fetch_all_enrichments
from ..services.risk_engine import calculate_risk_assessment
from ..models.cve import CVE
from ..schemas.requests import BatchLookupRequest, CompareRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cve", tags=["CVE"])
settings = get_settings()

# Reject malformed IDs at the edge (422) instead of spending upstream API quota.
CVE_ID_PATTERN = r"^(?i:CVE)-\d{4}-\d{4,}$"
CveIdPath = Path(
    ...,
    pattern=CVE_ID_PATTERN,
    description="CVE identifier, e.g. CVE-2021-44228",
    examples=["CVE-2021-44228"],
)


def _split_results(cve_ids: list[str], results: list) -> tuple[list, list]:
    """Split gather() results into found summaries and per-CVE errors.

    Any exception (not just HTTPException) is routed to ``errors`` so an
    unexpected failure for one CVE never corrupts the batch response.
    """
    found = []
    errors = []
    for cve_id, res in zip(cve_ids, results):
        if isinstance(res, HTTPException):
            errors.append({"cve_id": cve_id, "error": res.detail})
        elif isinstance(res, Exception):
            logger.warning("Unexpected error loading %s: %r", cve_id, res)
            errors.append({"cve_id": cve_id, "error": "Internal error while loading CVE metadata"})
        else:
            found.append(res)
    return found, errors


def _summary(cve_data: dict, risk: dict) -> dict:
    """Compact summary used by batch + compare views."""
    best_cvss = cve_data.get("best_cvss") or {}
    epss = cve_data.get("epss") or {}
    kev = cve_data.get("kev")
    return {
        "cve_id": cve_data["cve_id"],
        "description": (cve_data.get("description") or "")[:300],
        "published_date": cve_data.get("published_date"),
        "cwes": cve_data.get("cwes", []),
        "products": cve_data.get("products", [])[:10],
        "best_cvss": best_cvss,
        "cvss_scores": cve_data.get("cvss_scores", []),
        "epss": epss,
        "kev": kev,
        "exploit_count": len(cve_data.get("exploits", [])),
        "risk": risk,
    }


async def _load_cve_with_risk(cve_id: str) -> dict:
    """Fetch + persist risk for one CVE. Raises HTTPException(404) on miss.

    Uses a dedicated session so calls can run truly in parallel inside
    ``asyncio.gather`` without interleaving commits on a shared connection.
    """
    async with AsyncSessionLocal() as db:
        try:
            cve_data = await get_or_create_cve(db, cve_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

        risk = calculate_risk_assessment(cve_data)

        result = await db.execute(select(CVE).where(CVE.cve_id == cve_id))
        db_cve = result.scalar_one_or_none()
        if db_cve:
            db_cve.risk_score = risk["score"]
            db_cve.risk_level = risk["level"]
            db_cve.priority = risk["priority"]
        await db.commit()

    return _summary(cve_data, risk)


@router.get("/{cve_id}")
@limiter.limit(settings.RATE_LIMIT_LOOKUP)
async def lookup_cve(request: Request, cve_id: str = CveIdPath, db: AsyncSession = Depends(get_db)):
    """Full CVE lookup with structured intelligence and transparent risk assessment."""
    cve_id = cve_id.upper()
    try:
        cve_data = await get_or_create_cve(db, cve_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    risk = calculate_risk_assessment(cve_data)

    result = await db.execute(select(CVE).where(CVE.cve_id == cve_id))
    db_cve = result.scalar_one_or_none()
    if db_cve:
        db_cve.risk_score = risk["score"]
        db_cve.risk_level = risk["level"]
        db_cve.priority = risk["priority"]
        await db.commit()

    return {
        **cve_data,
        "risk": risk,
    }


@router.post("/batch")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def batch_lookup(request: Request, data: BatchLookupRequest):
    """Consolidated risk summary for up to 20 CVEs (fetched in parallel)."""
    results = await asyncio.gather(
        *(_load_cve_with_risk(cve_id) for cve_id in data.cve_ids),
        return_exceptions=True,
    )

    found, errors = _split_results(data.cve_ids, results)

    return {"results": found, "errors": errors}


@router.post("/compare")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def compare_cves(request: Request, data: CompareRequest):
    """Side-by-side comparison of up to 3 CVEs."""
    results = await asyncio.gather(
        *(_load_cve_with_risk(cve_id) for cve_id in data.cve_ids),
        return_exceptions=True,
    )

    found, errors = _split_results(data.cve_ids, results)

    if not found:
        raise HTTPException(status_code=404, detail="None of the requested CVEs could be found")

    return {"results": found, "errors": errors}


@router.get("/{cve_id}/enrichments")
@limiter.limit(settings.RATE_LIMIT_DEFAULT)
async def get_enrichments(request: Request, cve_id: str = CveIdPath):
    """Fetch raw enrichments (EPSS, KEV, exploits) for a CVE."""
    return await fetch_all_enrichments(cve_id)