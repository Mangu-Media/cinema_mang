from __future__ import annotations

from cse_orchestrator.schemas.contracts import ArtifactName
from cse_orchestrator.utils.s3 import S3Location
from cse_orchestrator.utils.settings import settings


_KEYS = {
    ArtifactName.RAW_SCRIPT: "jobs/{job_id}/raw/script.txt",
    ArtifactName.SEMANTIC_FRAMES: "jobs/{job_id}/semantic/frames.json",
    ArtifactName.CINEMATIC_PLAN: "jobs/{job_id}/cinematic/plan.json",
    ArtifactName.BREAKDOWN: "jobs/{job_id}/production/breakdown.json",
    ArtifactName.STRIPBOARD: "jobs/{job_id}/production/stripboard.json",
    ArtifactName.LOOKBOOK: "jobs/{job_id}/picture/lookbook.json",
    ArtifactName.BIBLE: "jobs/{job_id}/picture/bible.json",
}


def artifact_key(job_id: str, artifact: ArtifactName) -> str:
    template = _KEYS.get(artifact)
    if not template:
        raise ValueError(f"Unknown artifact: {artifact}")
    return template.format(job_id=job_id)


def artifact_location(job_id: str, artifact: ArtifactName) -> S3Location:
    return S3Location(bucket=settings.s3_bucket, key=artifact_key(job_id, artifact))
