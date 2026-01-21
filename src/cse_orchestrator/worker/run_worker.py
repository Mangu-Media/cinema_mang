from __future__ import annotations

import asyncio
import logging

from temporalio.client import Client
from temporalio.worker import Worker

from cse_orchestrator.utils.logging import setup_logging
from cse_orchestrator.utils.s3 import ensure_bucket_exists
from cse_orchestrator.utils.settings import settings
from cse_orchestrator.worker.activities import (
    cinematic_planning_activity,
    semantic_analysis_activity,
    set_status_activity,
    write_artifact_activity,
)
from cse_orchestrator.worker.workflow import ScriptToScreenWorkflow

log = logging.getLogger(__name__)

async def amain() -> None:
    setup_logging()
    ensure_bucket_exists(settings.s3_bucket)

    # In local dev with auto-setup, it might take a moment for Temporal to be ready.
    # In a real app we'd have retries here.
    client = await Client.connect(settings.temporal_address)
    worker = Worker(
        client,
        task_queue=settings.temporal_task_queue,
        workflows=[ScriptToScreenWorkflow],
        activities=[
            set_status_activity,
            semantic_analysis_activity,
            cinematic_planning_activity,
            write_artifact_activity,
        ],
    )
    log.info("Worker started task_queue=%s", settings.temporal_task_queue)
    await worker.run()

def main() -> None:
    asyncio.run(amain())

if __name__ == "__main__":
    main()
