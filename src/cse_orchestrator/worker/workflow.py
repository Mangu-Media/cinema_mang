from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from cse_orchestrator.schemas.contracts import ArtifactName, JobStatus
    from cse_orchestrator.worker.activities import (
        bible_activity,
        breakdown_activity,
        cinematic_planning_activity,
        lookbook_activity,
        semantic_analysis_activity,
        set_status_activity,
        stripboard_activity,
        write_artifact_activity,
    )


@dataclass
class ScriptToScreenInput:
    job_id: str
    script_text: str | None
    parameters: dict[str, Any]


@workflow.defn
class ScriptToScreenWorkflow:
    @workflow.run
    async def run(self, inp: ScriptToScreenInput) -> None:
        timeout = 120
        write_timeout = 60
        retry = workflow.RetryPolicy(maximum_attempts=3)

        await workflow.execute_activity(
            set_status_activity,
            args=[inp.job_id, JobStatus.RUNNING.value, None],
            start_to_close_timeout=30,
        )

        semantic = await workflow.execute_activity(
            semantic_analysis_activity,
            args=[inp.job_id, inp.script_text, inp.parameters],
            start_to_close_timeout=timeout,
            retry_policy=retry,
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.SEMANTIC_FRAMES.value, semantic],
            start_to_close_timeout=write_timeout,
        )

        plan = await workflow.execute_activity(
            cinematic_planning_activity,
            args=[inp.job_id, semantic, inp.parameters],
            start_to_close_timeout=timeout,
            retry_policy=retry,
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.CINEMATIC_PLAN.value, plan],
            start_to_close_timeout=write_timeout,
        )

        breakdown = await workflow.execute_activity(
            breakdown_activity,
            args=[inp.job_id, semantic, inp.parameters],
            start_to_close_timeout=timeout,
            retry_policy=retry,
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.BREAKDOWN.value, breakdown],
            start_to_close_timeout=write_timeout,
        )

        board = await workflow.execute_activity(
            stripboard_activity,
            args=[inp.job_id, breakdown, inp.parameters],
            start_to_close_timeout=timeout,
            retry_policy=retry,
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.STRIPBOARD.value, board],
            start_to_close_timeout=write_timeout,
        )

        look = await workflow.execute_activity(
            lookbook_activity,
            args=[inp.job_id, plan, semantic, inp.parameters],
            start_to_close_timeout=timeout,
            retry_policy=retry,
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.LOOKBOOK.value, look],
            start_to_close_timeout=write_timeout,
        )

        bible = await workflow.execute_activity(
            bible_activity,
            args=[inp.job_id, semantic, plan, breakdown, inp.parameters],
            start_to_close_timeout=timeout,
            retry_policy=retry,
        )
        await workflow.execute_activity(
            write_artifact_activity,
            args=[inp.job_id, ArtifactName.BIBLE.value, bible],
            start_to_close_timeout=write_timeout,
        )

        await workflow.execute_activity(
            set_status_activity,
            args=[inp.job_id, JobStatus.SUCCEEDED.value, None],
            start_to_close_timeout=30,
        )
