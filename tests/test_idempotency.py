from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from cse_orchestrator.api.main import create_app
from cse_orchestrator.db.models import Base
from cse_orchestrator.utils import db as db_mod

def test_idempotent_create(monkeypatch):
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def _override_db_session():
        session = TestingSessionLocal()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    # Patch the engine used in startup
    from cse_orchestrator.utils import db as db_utils
    monkeypatch.setattr(db_utils, "engine", engine)

    # Patch s3 check in startup
    from cse_orchestrator.utils import s3 as s3_utils
    monkeypatch.setattr(s3_utils, "ensure_bucket_exists", lambda bucket: None)

    # Patch temporal client in submit_job to avoid connection error
    # We need to mock the coroutine _temporal_client
    from cse_orchestrator.api.routers import jobs

    async def mock_temporal_client():
        class MockClient:
            async def start_workflow(self, *args, **kwargs):
                pass
        return MockClient()

    monkeypatch.setattr(jobs, "_temporal_client", mock_temporal_client)
    # Patch put_bytes in jobs to avoid S3 connection
    monkeypatch.setattr(jobs, "put_bytes", lambda loc, content, content_type: None)

    # Also patch the engine in main to prevent startup errors
    from cse_orchestrator.api import main
    monkeypatch.setattr(main, "engine", engine)
    # And ensure_bucket_exists in main
    monkeypatch.setattr(main, "ensure_bucket_exists", lambda bucket: None)

    app = create_app()

    # Use dependency_overrides for get_db
    from cse_orchestrator.api import deps
    app.dependency_overrides[deps.get_db] = _override_db_session

    client = TestClient(app)

    job_id = "job-123"
    r1 = client.post(
        "/v1/jobs",
        data={"job_id": job_id, "script_text": "INT. ROOM\nA PERSON walks."},
    )
    assert r1.status_code == 200
    r2 = client.post(
        "/v1/jobs",
        data={"job_id": job_id, "script_text": "INT. ROOM\nA PERSON walks."},
    )
    assert r2.status_code == 200
    assert r1.json()["job_id"] == r2.json()["job_id"] == job_id
