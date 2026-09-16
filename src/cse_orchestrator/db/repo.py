from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from cse_orchestrator.db.models import Job, JobEvent
from cse_orchestrator.schemas.contracts import JobStatus
from cse_orchestrator.utils.time import utc_now


def get_job(session: Session, job_id: str) -> Job | None:
    return session.get(Job, job_id)


def list_jobs(session: Session, limit: int = 100) -> list[Job]:
    q = select(Job).order_by(Job.updated_at.desc()).limit(limit)
    return list(session.execute(q).scalars().all())


def create_job_if_absent(session: Session, job_id: str, parameters: dict[str, Any]) -> Job:
    existing = get_job(session, job_id)
    if existing:
        return existing

    job = Job(job_id=job_id, status=JobStatus.PENDING, parameters=parameters, artifacts={})
    session.add(job)
    session.flush()
    append_event(session, job_id=job_id, type_="JOB_CREATED", message="Job created", data={})
    return job


def set_job_status(session: Session, job_id: str, status: JobStatus | str, error_message: str | None = None) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    job.status = status if isinstance(status, JobStatus) else JobStatus(status)
    job.updated_at = utc_now()
    job.error_message = error_message
    session.add(job)


def update_artifact(session: Session, job_id: str, artifact_name: str, s3_key: str) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise ValueError("Job not found")
    artifacts = dict(job.artifacts or {})
    artifacts[artifact_name] = s3_key
    job.artifacts = artifacts
    job.updated_at = utc_now()
    session.add(job)


def append_event(session: Session, job_id: str, type_: str, message: str, data: dict[str, Any]) -> JobEvent:
    evt = JobEvent(job_id=job_id, type=type_, message=message, data=data)
    session.add(evt)
    session.flush()
    return evt


def list_events(session: Session, job_id: str, limit: int = 200) -> list[JobEvent]:
    q = select(JobEvent).where(JobEvent.job_id == job_id).order_by(JobEvent.id.asc()).limit(limit)
    return list(session.execute(q).scalars().all())
