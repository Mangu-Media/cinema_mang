from __future__ import annotations

import re
from typing import Any

from cse_orchestrator.core.domain import CinematicPlan, SemanticFrame, Shot

_HEADING = re.compile(
    r"^(INT\.|EXT\.|INT/EXT\.|I/E\.)\s*(.+?)(?:\s+[-\u2013\u2014]\s+(DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER))?$",
    re.I | re.M,
)


def _split_scenes(script_text: str) -> list[str]:
    parts = re.split(r"(?=^\s*(?:INT\.|EXT\.|INT/EXT\.|I/E\.)\b)", script_text, flags=re.I | re.M)
    cleaned = [c.strip() for c in parts if c.strip()]
    return cleaned if cleaned else [script_text.strip() or "UNTITLED SCENE"]


def _heading_meta(scene: str) -> tuple[str, str, str, str]:
    first = scene.splitlines()[0].strip() if scene else ""
    m = _HEADING.match(first)
    if not m:
        return first[:80], "", first[:80], ""
    int_ext, rest, tod = m.group(1).upper(), m.group(2).strip(), (m.group(3) or "").upper()
    return first[:120], int_ext, rest[:80], tod


def _extract_entities(text: str) -> dict[str, list[str]]:
    characters = sorted(set(re.findall(r"^\s*([A-Z][A-Z0-9 \-']{2,})$", text, re.M)))
    if not characters:
        characters = sorted(set(re.findall(r"\b[A-Z][A-Z0-9]{2,}\b", text)))
    props = sorted(set(re.findall(r"\b(gun|phone|car|knife|bag|key|letter|radio|badge|camera|truck|hose)\b", text, re.I)))
    locations = sorted(set(re.findall(r"\b(kitchen|street|office|bedroom|warehouse|diner|alley|rooftop|precinct)\b", text, re.I)))
    wardrobe = sorted(set(re.findall(r"\b(coat|uniform|suit|dress|boots|hat|gloves)\b", text, re.I)))
    vehicles = sorted(set(re.findall(r"\b(car|truck|van|taxi|ambulance|engine)\b", text, re.I)))
    fx = sorted(set(re.findall(r"\b(rain|fire|smoke|blood|spark|explosion|steam)\b", text, re.I)))
    return {
        "characters": [c.title() if c.isupper() else c for c in characters[:20]],
        "props": [p.lower() for p in props[:20]],
        "locations": [l.lower() for l in locations[:20]],
        "wardrobe": [w.lower() for w in wardrobe[:20]],
        "vehicles": [v.lower() for v in vehicles[:20]],
        "fx": [f.lower() for f in fx[:20]],
    }


def semantic_analysis(script_text: str) -> dict[str, Any]:
    scenes = _split_scenes(script_text)
    frames: list[dict[str, Any]] = []
    for idx, scene in enumerate(scenes, start=1):
        heading, int_ext, loc, tod = _heading_meta(scene)
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", scene) if s.strip() and not s.isupper()]
        beats = sentences[:8] if sentences else [scene[:200]]
        frames.append(
            SemanticFrame(
                scene_index=idx,
                beats=beats,
                entities=_extract_entities(scene),
                raw_excerpt=scene[:1200],
                heading=heading,
                int_ext=int_ext,
                time_of_day=tod,
            ).__dict__
        )
    return {"version": "1.1", "frames": frames}


def cinematic_planning(semantic_frames: dict[str, Any]) -> dict[str, Any]:
    frames = semantic_frames.get("frames", [])
    shots: list[dict[str, Any]] = []
    shot_idx = 1
    cycle = ("WIDE", "MEDIUM", "CLOSE_UP", "INSERT")
    for frame in frames:
        beats = frame.get("beats", [])
        entities = frame.get("entities", {})
        characters = entities.get("characters", [])
        locations = entities.get("locations", [])
        scene_index = int(frame.get("scene_index") or 1)
        for beat in beats[:5]:
            shot_type = cycle[(shot_idx - 1) % len(cycle)]
            duration = 2.4 if shot_type == "INSERT" else (3.5 if shot_type == "CLOSE_UP" else 5.0)
            camera = {
                "focal_length_mm": {"WIDE": 24, "MEDIUM": 35, "CLOSE_UP": 50, "INSERT": 85}[shot_type],
                "movement": "DOLLY_IN" if shot_type == "CLOSE_UP" else ("TRACK" if shot_type == "WIDE" else "STATIC"),
                "height_m": 1.6,
                "target": (characters[0] if characters else "SUBJECT"),
            }
            place = locations[0] if locations else frame.get("heading") or "scene"
            shots.append(
                Shot(
                    shot_index=shot_idx,
                    shot_type=shot_type,
                    duration_s=duration,
                    camera=camera,
                    description=f"{shot_type} in {place}: {beat}",
                    scene_index=scene_index,
                ).__dict__
            )
            shot_idx += 1
    plan = CinematicPlan(shots=[Shot(**s) for s in shots], notes=["Deterministic planner."]).__dict__
    plan["shots"] = shots
    return {"version": "1.1", "plan": plan}


def production_breakdown(semantic_frames: dict[str, Any]) -> dict[str, Any]:
    rows = []
    for frame in semantic_frames.get("frames", []):
        entities = frame.get("entities", {})
        excerpt = frame.get("raw_excerpt") or ""
        pages = max(0.1, round(len(excerpt) / 900, 1))
        rows.append(
            {
                "scene_index": frame.get("scene_index"),
                "heading": frame.get("heading") or f"SCENE {frame.get('scene_index')}",
                "pages": pages,
                "int_ext": frame.get("int_ext") or "",
                "time_of_day": frame.get("time_of_day") or "",
                "cast": entities.get("characters", []),
                "props": entities.get("props", []),
                "wardrobe": entities.get("wardrobe", []),
                "vehicles": entities.get("vehicles", []),
                "fx": entities.get("fx", []),
                "locations": entities.get("locations", []),
                "notes": "",
            }
        )
    return {"version": "1.1", "rows": rows}


def stripboard_from_breakdown(breakdown: dict[str, Any], parameters: dict[str, Any] | None = None) -> dict[str, Any]:
    rows = breakdown.get("rows", [])
    pages_per_day = float((parameters or {}).get("pages_per_day") or 4.0)
    days: list[dict[str, Any]] = []
    bucket: list[int] = []
    pages = 0.0
    day = 1
    for row in rows:
        bucket.append(int(row.get("scene_index") or 0))
        pages += float(row.get("pages") or 0.1)
        if pages >= pages_per_day:
            days.append({"day": day, "date_label": f"Day {day}", "company_move": day > 1, "scenes": bucket[:], "estimated_pages": round(pages, 1), "notes": ""})
            day += 1
            bucket, pages = [], 0.0
    if bucket:
        days.append({"day": day, "date_label": f"Day {day}", "company_move": day > 1, "scenes": bucket[:], "estimated_pages": round(pages, 1), "notes": ""})
    return {"version": "1.1", "days": days, "pages_per_day": pages_per_day}


def lookbook_from_plan(plan_doc: dict[str, Any], semantic_frames: dict[str, Any]) -> dict[str, Any]:
    frames = semantic_frames.get("frames", [])
    night = any((f.get("time_of_day") or "").upper() == "NIGHT" for f in frames)
    notes = [
        {"name": "Key", "palette": ["#080809", "#eceae4", "#c9c4b8"] if night else ["#eceae4", "#1a1a1c", "#6e6a62"], "lens": "35mm spherical", "grain": "fine 250D / 500T", "reference": "Practical interiors, motivated sources."},
        {"name": "Close work", "palette": ["#1c1410", "#d7cfc4", "#8a3b2a"], "lens": "50mm", "grain": "visible on faces", "reference": "Hold on eyes. Let silence play."},
    ]
    return {"version": "1.1", "notes": notes, "aspect": "2.39:1"}


def bible_from_bundle(semantic_frames: dict[str, Any], plan_doc: dict[str, Any], breakdown: dict[str, Any]) -> dict[str, Any]:
    frames = semantic_frames.get("frames", [])
    shots = (plan_doc.get("plan") or {}).get("shots") or []
    cast: set[str] = set()
    for f in frames:
        cast.update(f.get("entities", {}).get("characters", []))
    return {
        "version": "1.1",
        "logline": frames[0]["beats"][0] if frames and frames[0].get("beats") else "A script enters the floor.",
        "scene_count": len(frames),
        "shot_count": len(shots),
        "cast": sorted(cast),
        "runtime_estimate_min": round(sum(float(s.get("duration_s") or 0) for s in shots) / 60, 1),
        "tone": "Naturalistic, observational, no slop.",
    }
