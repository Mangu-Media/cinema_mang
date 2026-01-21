from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from cse_orchestrator.worker.activities import (
        cinematic_planning_activity,
        semantic_analysis_activity,
        set_status_activity,
        write_artifact_activity,
    )
    from cse_orchestrator.schemas.contracts import ArtifactName, JobStatus

@dataclass
class ScriptToScreenInput:
    job_id: str
    script_text: str | None
    parameters: dict[str, Any]

@workflow.defn
class ScriptToScreenWorkflow:
    @workflow.run
    async def run(self, inp: ScriptToScreenInput) -> None:
        await workflow.execute_activity(
            set_status_activity,
            args=[inp.job_id, JobStatus.RUNNING.value, None],
            start_to_close_timeout=30,
        )

        semantic = await workflow.execute_activity(
            semantic_analysis_activity,
            args=[inp.job_id, inp.script_text, inp.parameters],
            start_to_close_timeout=120,
            retry_policy=workflow.RetryPolicy(maximum_attempts=3),
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.SEMANTIC_FRAMES.value, semantic],
            start_to_close_timeout=60,
        )

        plan = await workflow.execute_activity(
            cinematic_planning_activity,
            args=[inp.job_id, semantic, inp.parameters],
            start_to_close_timeout=120,
            retry_policy=workflow.RetryPolicy(maximum_attempts=3),
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.CINEMATIC_PLAN.value, plan],
            start_to_close_timeout=60,
        )

        await workflow.execute_activity(
            set_status_activity,
            args=[inp.job_id, JobStatus.SUCCEEDED.value, None],
            start_to_close_timeout=30,
        )
