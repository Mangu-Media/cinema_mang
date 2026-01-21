from __future__ import annotations

from cse_orchestrator.schemas.contracts import ArtifactName
from cse_orchestrator.utils.settings import settings
from cse_orchestrator.utils.s3 import S3Location

def artifact_key(job_id: str, artifact: ArtifactName) -> str:
    if artifact == ArtifactName.RAW_SCRIPT:
        return f"jobs/{job_id}/raw/script.txt"
    if artifact == ArtifactName.SEMANTIC_FRAMES:
        return f"jobs/{job_id}/semantic/frames.json"
    if artifact == ArtifactName.CINEMATIC_PLAN:
        return f"jobs/{job_id}/cinematic/plan.json"
    raise ValueError(f"Unknown artifact: {artifact}")

def artifact_location(job_id: str, artifact: ArtifactName) -> S3Location:
    return S3Location(bucket=settings.s3_bucket, key=artifact_key(job_id, artifact))
