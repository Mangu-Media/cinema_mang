from __future__ import annotations

from dataclasses import dataclass
from typing import Any

@dataclass(frozen=True)
class SemanticFrame:
    scene_index: int
    beats: list[str]
    entities: dict[str, list[str]]  # {"characters": [...], "props": [...], ...}
    raw_excerpt: str

@dataclass(frozen=True)
class Shot:
    shot_index: int
    shot_type: str
    duration_s: float
    camera: dict[str, Any]
    description: str

@dataclass(frozen=True)
class CinematicPlan:
    shots: list[Shot]
    notes: list[str]
