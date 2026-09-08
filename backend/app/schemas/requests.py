"""Request schemas for batch and comparison operations."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

import re

CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,}$", re.IGNORECASE)


class BatchLookupRequest(BaseModel):
    cve_ids: list[str] = Field(..., min_length=1, max_length=20)

    @field_validator("cve_ids")
    @classmethod
    def normalize_and_validate(cls, v: list[str]) -> list[str]:
        cleaned = [x.strip().upper() for x in v if x and x.strip()]
        if not cleaned:
            raise ValueError("At least one CVE ID is required")
        invalid = [c for c in cleaned if not CVE_RE.match(c)]
        if invalid:
            raise ValueError(f"Invalid CVE ID format: {', '.join(invalid)}")
        # preserve order but drop duplicates
        seen = set()
        result = []
        for c in cleaned:
            if c not in seen:
                seen.add(c)
                result.append(c)
        return result


class CompareRequest(BatchLookupRequest):
    cve_ids: list[str] = Field(..., min_length=2, max_length=3)