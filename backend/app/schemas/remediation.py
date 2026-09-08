from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

CVE_RE = re.compile(r"^CVE-\d{4}-\d{4,}$", re.IGNORECASE)

VALID_STATUSES = {"open", "assigned", "in_progress", "fixed", "verified", "closed"}
VALID_PRIORITIES = {"p1_critical", "p2_high", "p3_medium", "p4_low"}


class RemediationBase(BaseModel):
    cve_id: str = Field(..., min_length=8, max_length=20)
    priority: str = Field(..., min_length=1, max_length=20)
    assigned_to: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    due_date: Optional[datetime] = None

    @field_validator("cve_id")
    @classmethod
    def validate_cve_id(cls, v: str) -> str:
        v = v.strip().upper()
        if not CVE_RE.match(v):
            raise ValueError(f"Invalid CVE ID format: {v}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_PRIORITIES:
            raise ValueError(f"Invalid priority: {v}. Must be one of: {', '.join(sorted(VALID_PRIORITIES))}")
        return v


class RemediationUpdate(BaseModel):
    status: Optional[str] = Field(None, min_length=1, max_length=20)
    assigned_to: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    due_date: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip().lower()
        if v not in VALID_STATUSES:
            raise ValueError(f"Invalid status: {v}. Must be one of: {', '.join(sorted(VALID_STATUSES))}")
        return v


class RemediationResponse(RemediationBase):
    id: int
    status: str
    history: list = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
