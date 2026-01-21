from __future__ import annotations

from typing import Iterator

from sqlalchemy.orm import Session

from cse_orchestrator.utils.db import db_session

def get_db() -> Iterator[Session]:
    with db_session() as s:
        yield s
