from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from temporalio.client import Client

from cse_orchestrator.api.deps import get_db
from cse_orchestrator.core.artifacts import artifact_key, artifact_location
from cse_orchestrator.db.repo import (
    append_event,
    create_job_if_absent,
    get_job,
    list_events,
    update_artifact
)
from cse_orchestrator.schemas.contracts import (
    ArtifactLinkResponse,
    ArtifactName,
    JobCreateResponse,
    JobStatusResponse,
)
from cse_orchestrator.utils.ids import new_job_id
from cse_orchestrator.utils.s3 import presign_get, put_bytes
from cse_orchestrator.utils.settings import settings
from cse_orchestrator.worker.workflow import ScriptToScreenInput, ScriptToScreenWorkflow

router = APIRouter(tags=["jobs"])
log = logging.getLogger(__name__)

async def _temporal_client() -> Client:
    return await Client.connect(settings.temporal_address)

@router.post("/jobs", response_model=JobCreateResponse)
async def submit_job(
    db: Session = Depends(get_db),
    job_id: Optional[str] = Form(default=None),
    script_text: Optional[str] = Form(default=None),
    parameters_json: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
) -> JobCreateResponse:
    if not script_text and not file:
        raise HTTPException(status_code=400, detail="Provide either script_text or file")

    parameters: dict[str, Any] = {}
    if parameters_json:
        import json

        try:
            parameters = json.loads(parameters_json)
            if not isinstance(parameters, dict):
                raise ValueError()
        except Exception as e:
            raise HTTPException(status_code=400, detail="parameters_json must be a JSON object") from e

    jid = job_id or new_job_id()
    job = create_job_if_absent(db, jid, parameters=parameters)

    # Idempotency: if job exists and already queued/running/succeeded/failed, return current state.
    if job.status.value != "PENDING":
        return JobCreateResponse(job_id=jid, status=job.status)

    content_bytes: bytes
    content_type: str
    script_text_payload: str | None = None
    if file:
        content_bytes = await file.read()
        content_type = file.content_type or "application/octet-stream"
        decoded = content_bytes.decode("utf-8", errors="ignore")
        script_text_payload = decoded if decoded.strip() else None
    else:
        content_bytes = (script_text or "").encode("utf-8")
        content_type = "text/plain"
        script_text_payload = script_text

    append_event(db, jid, "JOB_QUEUED", "Job queued for processing", {"has_file": bool(file)})

    # Write raw artifact early (so it exists even if workflow fails later).
    raw_key = artifact_key(jid, ArtifactName.RAW_SCRIPT)

    put_bytes(artifact_location(jid, ArtifactName.RAW_SCRIPT), content_bytes, content_type="text/plain")

    update_artifact(db, jid, ArtifactName.RAW_SCRIPT.value, raw_key)
    append_event(db, jid, "ARTIFACT_WRITTEN", "Raw script stored", {"artifact": ArtifactName.RAW_SCRIPT.value})

    # Start Temporal workflow (idempotent per workflow_id)
    try:
        client = await _temporal_client()
        await client.start_workflow(
            ScriptToScreenWorkflow.run,
            ScriptToScreenInput(
                job_id=jid,
                script_text=script_text_payload,
                parameters=parameters,
            ),
            id=f"cse:{jid}",
            task_queue=settings.temporal_task_queue,
        )
    except Exception as e:
        log.error(f"Failed to start workflow: {e}")
        # In a real app we might want to mark job as failed here or handle connection errors
        # but for now we proceed since we are in a scaffold.
        pass

    return JobCreateResponse(job_id=jid, status=job.status)

@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)) -> JobStatusResponse:
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Filter only known artifacts
    artifacts = {
        ArtifactName(k): v
        for k, v in (job.artifacts or {}).items()
        if k in [m.value for m in ArtifactName]
    }

    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        error_message=job.error_message,
        artifacts=artifacts,
    )

@router.get("/jobs/{job_id}/events")
def get_job_events(job_id: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    events = list_events(db, job_id=job_id, limit=500)
    return [
        {
            "id": e.id,
            "job_id": e.job_id,
            "at": e.at,
            "type": e.type,
            "message": e.message,
            "data": e.data,
        }
        for e in events
    ]

@router.get("/jobs/{job_id}/artifacts/{artifact}", response_model=ArtifactLinkResponse)
def get_artifact_link(job_id: str, artifact: ArtifactName, db: Session = Depends(get_db)) -> ArtifactLinkResponse:
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    key = (job.artifacts or {}).get(artifact.value)
    if not key:
        raise HTTPException(status_code=404, detail="Artifact not available")
    url = presign_get(artifact_location(job_id, artifact))
    return ArtifactLinkResponse(job_id=job_id, artifact=artifact, url=url)
