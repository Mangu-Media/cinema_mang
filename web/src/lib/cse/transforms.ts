import { estimateDurationS, estimatePages, splitScenes } from "./parser";
import type {
  Camera,
  CameraMovement,
  CoverageDensity,
  CoverageRole,
  CinematicPlan,
  PipelineParams,
  SemanticFrame,
  Shot,
  ShotType,
} from "./types";

const PROP_WORDS =
  /\b(gun|pistol|phone|car|sedan|knife|bag|key|keys|letter|thermos|radio|ticket|envelope|briefcase|watch|camera|cigarette|lighter|flashlight|umbrella|book|paperback|glass|bottle|cash|chip|badge|hat|coat)\b/gi;

const VEHICLE_WORDS = /\b(sedan|car|van|truck|motorcycle|taxi|coupe|suv)\b/gi;

const LOCATION_HINTS =
  /\b(kitchen|street|office|bedroom|warehouse|garage|booth|alley|rooftop|lobby|elevator|stairwell|diner|motel|apartment|bridge|pier|tunnel|parking)\b/gi;

const TONE_LEX: { re: RegExp; tone: string }[] = [
  { re: /\b(rain|wet|neon|night|shadow|sodium)\b/i, tone: "nocturne" },
  { re: /\b(gun|blood|chase|run|smash|hit)\b/i, tone: "violent" },
  { re: /\b(whisper|quiet|still|empty|alone)\b/i, tone: "hushed" },
  { re: /\b(laugh|joke|grin|wry)\b/i, tone: "wry" },
  { re: /\b(love|kiss|hand|soft)\b/i, tone: "intimate" },
];

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.trim();
    if (!key) continue;
    const k = key.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(key);
  }
  return out;
}

function matches(text: string, re: RegExp): string[] {
  const found: string[] = [];
  const copy = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = copy.exec(text))) {
    found.push((m[1] ?? m[0]).toLowerCase());
  }
  return unique(found);
}

function sceneTone(text: string): string {
  for (const row of TONE_LEX) {
    if (row.re.test(text)) return row.tone;
  }
  return "observational";
}

function beatsFromScene(action: string[], dialogue: { character: string; lines: string }[]): string[] {
  const fromAction = action
    .flatMap((a) => a.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 6);
  const fromDialogue = dialogue.slice(0, 3).map((d) => `${d.character}: ${d.lines.slice(0, 80)}`);
  const beats = [...fromAction, ...fromDialogue].slice(0, 8);
  return beats.length ? beats : ["Scene unfolds."];
}

export function semanticAnalysis(scriptText: string): { version: string; frames: SemanticFrame[] } {
  const scenes = splitScenes(scriptText);
  const frames: SemanticFrame[] = scenes.map((scene) => {
    const text = `${scene.heading}\n${scene.body}`;
    const characters = unique(scene.dialogue_blocks.map((d) => d.character));
    const pages = estimatePages(scene);
    return {
      scene_index: scene.scene_index,
      heading: scene.heading,
      slugline_kind: scene.slugline_kind,
      location: scene.location,
      time_of_day: scene.time_of_day,
      beats: beatsFromScene(scene.action, scene.dialogue_blocks),
      entities: {
        characters,
        props: matches(text, PROP_WORDS),
        locations: unique([scene.location.toLowerCase(), ...matches(text, LOCATION_HINTS)]),
        vehicles: matches(text, VEHICLE_WORDS),
      },
      raw_excerpt: scene.body.slice(0, 1200),
      tone: sceneTone(text),
      synopsis: (scene.action[0] ?? scene.dialogue_blocks[0]?.lines ?? scene.heading).slice(0, 220),
      pages,
      duration_est_s: estimateDurationS(pages),
    };
  });
  return { version: "1.0", frames };
}

function densityShots(density: CoverageDensity): number {
  if (density === "economy") return 2;
  if (density === "full") return 5;
  return 4;
}

function shotTypeFor(i: number, role: CoverageRole, isExt: boolean): ShotType {
  if (role === "establishing") return isExt ? "WIDE" : "WIDE";
  if (role === "insert") return "INSERT";
  if (role === "master") return "WIDE";
  const cycle: ShotType[] = ["MEDIUM", "OVER_SHOULDER", "CLOSE_UP", "TWO_SHOT", "POV"];
  return cycle[i % cycle.length] ?? "MEDIUM";
}

function movementFor(type: ShotType, tone: string): CameraMovement {
  if (tone === "violent") return type === "CLOSE_UP" ? "HANDHELD" : "STEADICAM";
  if (type === "CLOSE_UP" || type === "EXTREME_CLOSE_UP") return "DOLLY_IN";
  if (type === "WIDE") return "STATIC";
  if (type === "TRACKING" || type === "AERIAL") return "TRACKING";
  return "STATIC";
}

function focalFor(type: ShotType): number {
  switch (type) {
    case "WIDE":
    case "AERIAL":
      return 24;
    case "TRACKING":
      return 28;
    case "MEDIUM":
    case "TWO_SHOT":
      return 35;
    case "OVER_SHOULDER":
      return 40;
    case "CLOSE_UP":
    case "POV":
      return 50;
    case "EXTREME_CLOSE_UP":
    case "INSERT":
      return 85;
    default:
      return 35;
  }
}

function durationFor(type: ShotType): number {
  if (type === "CLOSE_UP" || type === "EXTREME_CLOSE_UP") return 3.5;
  if (type === "INSERT") return 2.5;
  if (type === "WIDE") return 6;
  return 4.5;
}

function camera(type: ShotType, tone: string, target: string): Camera {
  return {
    focal_length_mm: focalFor(type),
    movement: movementFor(type, tone),
    height_m: type === "AERIAL" ? 12 : type === "INSERT" ? 1.1 : 1.6,
    target,
    angle: type === "AERIAL" ? "top-down" : type === "CLOSE_UP" ? "eye-level" : "eye-level slight high",
  };
}

function letterCode(n: number): string {
  return String.fromCharCode(65 + (n % 26));
}

export function cinematicPlanning(
  semantic: { frames: SemanticFrame[] },
  params: PipelineParams,
): { version: string; plan: CinematicPlan } {
  const shots: Shot[] = [];
  let globalIndex = 1;
  const perScene = densityShots(params.coverage_density);

  for (const frame of semantic.frames) {
    const chars = frame.entities.characters;
    const target = chars[0] ?? "SUBJECT";
    const isExt = frame.slugline_kind === "EXT" || frame.slugline_kind === "EST";
    const roles: CoverageRole[] = ["establishing", "master"];
    if (perScene >= 3) roles.push("coverage");
    if (perScene >= 4) roles.push(frame.entities.props.length ? "insert" : "coverage");
    if (perScene >= 5) roles.push("coverage");

    roles.slice(0, perScene).forEach((role, i) => {
      const beat = frame.beats[Math.min(i, frame.beats.length - 1)] ?? frame.synopsis;
      const shot_type = shotTypeFor(i, role, isExt);
      const loc = frame.location || "scene";
      const desc = `${shot_type.replaceAll("_", " ")} — ${loc.toLowerCase()}. ${beat}`;
      shots.push({
        shot_index: globalIndex,
        shot_code: `${frame.scene_index}${letterCode(i)}`,
        shot_type,
        duration_s: durationFor(shot_type),
        camera: camera(shot_type, frame.tone, i === 0 ? loc : target),
        description: desc.slice(0, 280),
        dialogue: "",
        coverage_role: role,
        storyboard_prompt: `Cinematic still, ${shot_type.toLowerCase().replaceAll("_", " ")} shot, ${params.look}, ${frame.time_of_day.toLowerCase()} ${loc.toLowerCase()}, ${beat}. Photochemical film, no text.`,
        scene_index: frame.scene_index,
      });
      globalIndex += 1;
    });
  }

  const total = shots.reduce((s, sh) => s + sh.duration_s, 0);
  const plan: CinematicPlan = {
    shots,
    notes: [
      `Stub+heuristic planner · density ${params.coverage_density}`,
      `Genre ${params.genre} · look ${params.look}`,
      "Coverage pattern: establishing → master → coverage → insert.",
    ],
    total_duration_s: Math.round(total * 10) / 10,
    coverage_density: params.coverage_density,
  };
  return { version: "1.0", plan };
}
