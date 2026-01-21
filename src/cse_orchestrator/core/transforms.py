from __future__ import annotations

import re
from typing import Any

from cse_orchestrator.core.domain import CinematicPlan, SemanticFrame, Shot

def _split_scenes(script_text: str) -> list[str]:
    chunks = re.split(r"\n\s*(?:INT\.|EXT\.|INT/EXT\.)", script_text)
    cleaned = [c.strip() for c in chunks if c.strip()]
    return cleaned if cleaned else [script_text.strip()]

def _extract_entities(text: str) -> dict[str, list[str]]:
    # Tiny heuristic stub; replace with real NLP/LLM later.
    characters = sorted(set(re.findall(r"\b[A-Z][A-Z0-9]{2,}\b", text)))
    props = sorted(set(re.findall(r"\b(gun|phone|car|knife|bag|key|letter)\b", text, re.I)))
    locations = sorted(set(re.findall(r"\b(kitchen|street|office|bedroom|warehouse)\b", text, re.I)))
    return {
        "characters": characters[:20],
        "props": [p.lower() for p in props[:20]],
        "locations": [l.lower() for l in locations[:20]],
    }

def semantic_analysis(script_text: str) -> dict[str, Any]:
    scenes = _split_scenes(script_text)
    frames: list[dict[str, Any]] = []
    for idx, scene in enumerate(scenes, start=1):
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", scene) if s.strip()]
        beats = sentences[:8] if sentences else [scene[:200]]
        frames.append(
            SemanticFrame(
                scene_index=idx,
                beats=beats,
                entities=_extract_entities(scene),
                raw_excerpt=scene[:800],
            ).__dict__
        )
    return {"version": "1.0", "frames": frames}

def cinematic_planning(semantic_frames: dict[str, Any]) -> dict[str, Any]:
    frames = semantic_frames.get("frames", [])
    shots: list[dict[str, Any]] = []
    shot_idx = 1

    for frame in frames:
        beats = frame.get("beats", [])
        entities = frame.get("entities", {})
        characters = entities.get("characters", [])
        locations = entities.get("locations", [])

        for beat in beats[:4]:
            shot_type = "WIDE" if shot_idx % 3 == 1 else ("MEDIUM" if shot_idx % 3 == 2 else "CLOSE_UP")
            duration = 3.5 if shot_type == "CLOSE_UP" else 5.0
            camera = {
                "focal_length_mm": 24 if shot_type == "WIDE" else (35 if shot_type == "MEDIUM" else 50),
                "movement": "DOLLY_IN" if shot_type == "CLOSE_UP" else "STATIC",
                "height_m": 1.6,
                "target": (characters[0] if characters else "SUBJECT"),
            }
            desc = f"{shot_type} shot in {locations[0] if locations else 'scene'}: {beat}"
            shots.append(
                Shot(
                    shot_index=shot_idx,
                    shot_type=shot_type,
                    duration_s=duration,
                    camera=camera,
                    description=desc,
                ).__dict__
            )
            shot_idx += 1

    plan = CinematicPlan(shots=[Shot(**s) for s in shots], notes=["Stub planner output"]).__dict__
    # Re-assign list of dicts because __dict__ on dataclass doesn't recursively dictify
    plan["shots"] = shots
    return {"version": "1.0", "plan": plan}
