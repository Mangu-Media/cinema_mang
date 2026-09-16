from __future__ import annotations

import logging
from typing import Any

from temporalio import activity

from cse_orchestrator.core.artifacts import artifact_key, artifact_location
from cse_orchestrator.core.transforms import (
    bible_from_bundle,
    cinematic_planning,
    lookbook_from_plan,
    production_breakdown,
    semantic_analysis,
    stripboard_from_breakdown,
)
from cse_orchestrator.db.repo import append_event, set_job_status, update_artifact
from cse_orchestrator.utils.db import db_session
from cse_orchestrator.utils.s3 import put_json

log = logging.getLogger(__name__)


@activity.defn
def set_status_activity(job_id: str, status: str, error_message: str | None) -> None:
    with db_session() as db:
        set_job_status(db, job_id, status=status, error_message=error_message)
        append_event(
            db,
            job_id=job_id,
            type_="JOB_RUNNING" if status == "RUNNING" else ("JOB_FAILED" if status == "FAILED" else "JOB_SUCCEEDED"),
            message=f"Status set to {status}",
            data={"error_message": error_message} if error_message else {},
        )


@activity.defn
def semantic_analysis_activity(job_id: str, script_text: str | None, parameters: dict[str, Any]) -> dict[str, Any]:
    if not script_text:
        script_text = ""
    with db_session() as db:
        append_event(db, job_id, "USER_ACTION", "Semantic analysis started", {"parameters": parameters})
    return semantic_analysis(script_text)


@activity.defn
def cinematic_planning_activity(
    job_id: str, semantic_frames: dict[str, Any], parameters: dict[str, Any]
) -> dict[str, Any]:
    with db_session() as db:
        append_event(db, job_id, "USER_ACTION", "Cinematic planning started", {"parameters": parameters})
    return cinematic_planning(semantic_frames)


@activity.defn
def breakdown_activity(job_id: str, semantic_frames: dict[str, Any], parameters: dict[str, Any]) -> dict[str, Any]:
    with db_session() as db:
        append_event(db, job_id, "USER_ACTION", "Breakdown started", {"parameters": parameters})
    return production_breakdown(semantic_frames)


@activity.defn
def stripboard_activity(job_id: str, breakdown: dict[str, Any], parameters: dict[str, Any]) -> dict[str, Any]:
    with db_session() as db:
        append_event(db, job_id, "USER_ACTION", "Stripboard started", {"parameters": parameters})
    return stripboard_from_breakdown(breakdown, parameters)


@activity.defn
def lookbook_activity(job_id: str, plan: dict[str, Any], frames: dict[str, Any], parameters: dict[str, Any]) -> dict[str, Any]:
    with db_session() as db:
        append_event(db, job_id, "USER_ACTION", "Lookbook started", {"parameters": parameters})
    return lookbook_from_plan(plan, frames)


@activity.defn
def bible_activity(
    job_id: str,
    frames: dict[str, Any],
    plan: dict[str, Any],
    breakdown: dict[str, Any],
    parameters: dict[str, Any],
) -> dict[str, Any]:
    with db_session() as db:
        append_event(db, job_id, "USER_ACTION", "Bible started", {"parameters": parameters})
    return bible_from_bundle(frames, plan, breakdown)


@activity.defn
def write_artifact_activity(job_id: str, artifact_name: str, payload: dict[str, Any]) -> None:
    from cse_orchestrator.schemas.contracts import ArtifactName

    artifact = ArtifactName(artifact_name)
    loc = artifact_location(job_id, artifact)
    put_json(loc, payload)

    key = artifact_key(job_id, artifact)
    with db_session() as db:
        update_artifact(db, job_id, artifact.value, key)
        append_event(db, job_id, "ARTIFACT_WRITTEN", f"{artifact.value} stored", {"key": key})
