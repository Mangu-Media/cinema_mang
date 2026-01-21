from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from cse_orchestrator.schemas.contracts import JobStatus
from cse_orchestrator.utils.time import utc_now

class Base(DeclarativeBase):
    pass

class Job(Base):
    __tablename__ = "jobs"

    job_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    artifacts: Mapped[dict[str, str]] = mapped_column(JSON, default=dict, nullable=False)
    parameters: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

class JobEvent(Base):
    __tablename__ = "job_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
