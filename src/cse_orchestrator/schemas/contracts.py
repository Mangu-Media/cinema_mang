from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class ArtifactName(str, Enum):
    RAW_SCRIPT = "raw_script"
    SEMANTIC_FRAMES = "semantic_frames"
    CINEMATIC_PLAN = "cinematic_plan"
    BREAKDOWN = "breakdown"
    STRIPBOARD = "stripboard"
    LOOKBOOK = "lookbook"
    BIBLE = "bible"


class JobCreateRequest(BaseModel):
    job_id: Optional[str] = Field(default=None, description="If provided, enforces idempotency.")
    script_text: Optional[str] = Field(default=None, description="Raw script as text.")
    parameters: dict[str, Any] = Field(default_factory=dict)


class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None
    artifacts: dict[str, str] = Field(
        default_factory=dict,
        description="Artifact name to object storage key.",
    )
    parameters: dict[str, Any] = Field(default_factory=dict)


class JobListResponse(BaseModel):
    jobs: list[JobStatusResponse]


class JobEventResponse(BaseModel):
    id: int
    job_id: str
    at: datetime
    type: Literal[
        "JOB_CREATED",
        "JOB_QUEUED",
        "JOB_RUNNING",
        "ARTIFACT_WRITTEN",
        "JOB_SUCCEEDED",
        "JOB_FAILED",
        "USER_ACTION",
    ]
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class ArtifactLinkResponse(BaseModel):
    job_id: str
    artifact: ArtifactName
    url: str
