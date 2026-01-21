from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CSE_", case_sensitive=False)

    database_url: str = "postgresql+psycopg://cse:cse@localhost:5432/cse"

    s3_bucket: str = "cse-artifacts"
    s3_region: str = "us-east-1"
    s3_endpoint_url: str | None = "http://localhost:4566"
    local_dev_assume_s3: bool = True

    temporal_address: str = "localhost:7233"
    temporal_task_queue: str = "cse-orchestrator"

    api_public_base: str = "http://localhost:8000"

settings = Settings()
