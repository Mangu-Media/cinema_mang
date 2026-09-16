from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SemanticFrame:
    scene_index: int
    beats: list[str]
    entities: dict[str, list[str]]
    raw_excerpt: str
    heading: str = ""
    int_ext: str = ""
    time_of_day: str = ""


@dataclass(frozen=True)
class Shot:
    shot_index: int
    shot_type: str
    duration_s: float
    camera: dict[str, Any]
    description: str
    scene_index: int = 1


@dataclass(frozen=True)
class CinematicPlan:
    shots: list[Shot]
    notes: list[str]


@dataclass(frozen=True)
class BreakdownRow:
    scene_index: int
    heading: str
    pages: float
    cast: list[str]
    extras: list[str]
    props: list[str]
    wardrobe: list[str]
    vehicles: list[str]
    fx: list[str]
    locations: list[str]
    notes: str = ""


@dataclass(frozen=True)
class StripboardDay:
    day: int
    date_label: str
    company_move: bool
    scenes: list[int]
    estimated_pages: float
    notes: str = ""


@dataclass(frozen=True)
class LookNote:
    name: str
    palette: list[str]
    lens: str
    grain: str
    reference: str
