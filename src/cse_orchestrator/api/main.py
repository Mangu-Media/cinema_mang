from __future__ import annotations

import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cse_orchestrator.api.routers.jobs import router as jobs_router
from cse_orchestrator.db.models import Base
from cse_orchestrator.utils.db import engine
from cse_orchestrator.utils.logging import setup_logging
from cse_orchestrator.utils.s3 import ensure_bucket_exists
from cse_orchestrator.utils.settings import settings

log = logging.getLogger(__name__)

def create_app() -> FastAPI:
    setup_logging()

    app = FastAPI(title="CSE Orchestrator", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(jobs_router, prefix="/v1")

    @app.on_event("startup")
    async def _startup() -> None:
        Base.metadata.create_all(bind=engine)
        ensure_bucket_exists(settings.s3_bucket)
        log.info("Startup complete")

    return app

app = create_app()

def main() -> None:
    uvicorn.run("cse_orchestrator.api.main:app", host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    main()
