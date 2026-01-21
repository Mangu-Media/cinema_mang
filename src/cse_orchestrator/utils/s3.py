from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Optional

import boto3
from botocore.client import Config

from cse_orchestrator.utils.settings import settings

@dataclass(frozen=True)
class S3Location:
    bucket: str
    key: str

def _client() -> Any:
    s3_config = Config(signature_version="s3v4")
    session = boto3.session.Session()
    return session.client(
        "s3",
        region_name=settings.s3_region,
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id="test" if settings.local_dev_assume_s3 else None,
        aws_secret_access_key="test" if settings.local_dev_assume_s3 else None,
        config=s3_config,
    )

def ensure_bucket_exists(bucket: str) -> None:
    c = _client()
    try:
        c.head_bucket(Bucket=bucket)
    except Exception:
        c.create_bucket(Bucket=bucket)

def put_json(location: S3Location, payload: dict[str, Any]) -> None:
    c = _client()
    c.put_object(
        Bucket=location.bucket,
        Key=location.key,
        Body=json.dumps(payload).encode("utf-8"),
        ContentType="application/json",
    )

def put_bytes(location: S3Location, content: bytes, content_type: str) -> None:
    c = _client()
    c.put_object(Bucket=location.bucket, Key=location.key, Body=content, ContentType=content_type)

def get_json(location: S3Location) -> dict[str, Any]:
    c = _client()
    obj = c.get_object(Bucket=location.bucket, Key=location.key)
    data = obj["Body"].read()
    return json.loads(data)

def presign_get(location: S3Location, expires_s: int = 3600) -> str:
    c = _client()
    return c.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": location.bucket, "Key": location.key},
        ExpiresIn=expires_s,
    )

def presign_put(location: S3Location, content_type: Optional[str] = None, expires_s: int = 3600) -> str:
    c = _client()
    params: dict[str, Any] = {"Bucket": location.bucket, "Key": location.key}
    if content_type:
        params["ContentType"] = content_type
    return c.generate_presigned_url(
        ClientMethod="put_object",
        Params=params,
        ExpiresIn=expires_s,
    )
