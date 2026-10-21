import { cinematicPlanning, semanticAnalysis } from "./transforms";
import type {
  BreakdownCategory,
  BreakdownItemDraft,
  EntityKind,
  Lookbook,
  PipelineParams,
  ProductionPackage,
  ScheduleDayDraft,
  SemanticFrame,
} from "./types";

const PROP_CATEGORY: Record<string, BreakdownCategory> = {
  gun: "PROPS",
  pistol: "PROPS",
  knife: "PROPS",
  phone: "PROPS",
  bag: "PROPS",
  key: "PROPS",
  keys: "PROPS",
  letter: "PROPS",
  envelope: "PROPS",
  briefcase: "PROPS",
  thermos: "PROPS",
  radio: "PROPS",
  ticket: "PROPS",
  watch: "PROPS",
  camera: "PROPS",
  cigarette: "PROPS",
  lighter: "PROPS",
  flashlight: "PROPS",
  umbrella: "PROPS",
  book: "PROPS",
  paperback: "PROPS",
  glass: "PROPS",
  bottle: "PROPS",
  cash: "PROPS",
  chip: "PROPS",
  badge: "PROPS",
  hat: "WARDROBE",
  coat: "WARDROBE",
  sedan: "VEHICLES",
  car: "VEHICLES",
  van: "VEHICLES",
  truck: "VEHICLES",
  motorcycle: "VEHICLES",
  taxi: "VEHICLES",
};

function hashId(prefix: string, ...parts: string[]): string {
  const raw = `${prefix}:${parts.join(":")}`;
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return `${prefix}_${h.toString(16)}`;
}

export { hashId };

function buildBreakdown(frames: SemanticFrame[]): BreakdownItemDraft[] {
  const items: BreakdownItemDraft[] = [];
  const seen = new Set<string>();
  const push = (row: BreakdownItemDraft) => {
    const key = `${row.scene_index}|${row.category}|${row.name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(row);
  };

  for (const frame of frames) {
    for (const name of frame.entities.characters) {
      push({
        scene_index: frame.scene_index,
        category: "CAST",
        name,
        notes: `First billed in sc. ${frame.scene_index}`,
        quantity: 1,
      });
    }
    for (const prop of frame.entities.props) {
      const category = PROP_CATEGORY[prop] ?? "PROPS";
      push({
        scene_index: frame.scene_index,
        category,
        name: prop,
        notes: frame.heading,
        quantity: 1,
      });
    }
    for (const v of frame.entities.vehicles) {
      push({
        scene_index: frame.scene_index,
        category: "VEHICLES",
        name: v,
        notes: frame.location,
        quantity: 1,
      });
    }
    if (frame.slugline_kind === "EXT") {
      push({
        scene_index: frame.scene_index,
        category: "SPECIAL_EQ",
        name: "wet-down / rain",
        notes: frame.time_of_day === "NIGHT" ? "night exterior package" : "day exterior",
        quantity: 1,
      });
    }
    if (frame.tone === "violent") {
      push({
        scene_index: frame.scene_index,
        category: "STUNTS",
        name: "practical scuffle / fall",
        notes: "coordinate with SFX",
        quantity: 1,
      });
    }
    if (/\b(radio|score|music|song)\b/i.test(frame.raw_excerpt)) {
      push({
        scene_index: frame.scene_index,
        category: "MUSIC",
        name: "source radio",
        notes: "licensed or original sting",
        quantity: 1,
      });
    }
    push({
      scene_index: frame.scene_index,
      category: "SET_DRESSING",
      name: frame.location,
      notes: `${frame.slugline_kind} ${frame.time_of_day}`,
      quantity: 1,
    });
  }
  return items;
}

function buildSchedule(frames: SemanticFrame[]): ScheduleDayDraft[] {
  // Group by location + day/night. Target ~3–4 pages per day for a short.
  type Bucket = { key: string; location: string; tod: string; frames: SemanticFrame[] };
  const buckets: Bucket[] = [];
  for (const frame of frames) {
    const tod = frame.time_of_day.includes("NIGHT") ? "NIGHT" : "DAY";
    const key = `${frame.location.toUpperCase()}|${tod}`;
    const existing = buckets.find((b) => b.key === key);
    if (existing) existing.frames.push(frame);
    else buckets.push({ key, location: frame.location, tod, frames: [frame] });
  }

  const days: ScheduleDayDraft[] = [];
  let dayIndex = 1;
  let current: ScheduleDayDraft | null = null;
  let pagesOnDay = 0;

  const flush = () => {
    if (current) {
      current.estimated_pages = Math.round(pagesOnDay * 8) / 8;
      current.estimated_hours = Math.min(14, Math.max(6, Math.round(pagesOnDay * 3.2 + 4)));
      days.push(current);
    }
    current = null;
    pagesOnDay = 0;
  };

  for (const bucket of buckets) {
    for (const frame of bucket.frames) {
      if (!current || pagesOnDay + frame.pages > 3.6) {
        flush();
        current = {
          day_index: dayIndex,
          label: `Day ${dayIndex} · ${bucket.tod}`,
          location: bucket.location,
          notes: `${bucket.tod} company at ${bucket.location}`,
          estimated_pages: 0,
          estimated_hours: 0,
          strips: [],
        };
        dayIndex += 1;
        pagesOnDay = 0;
      }
      const move = current.strips.length > 0 && current.location !== frame.location;
      if (move) current.location = `${current.location} / ${frame.location}`;
      current.strips.push({
        scene_index: frame.scene_index,
        pages: frame.pages,
        company_move: move,
      });
      pagesOnDay += frame.pages;
    }
  }
  flush();
  return days;
}

function buildLookbook(frames: SemanticFrame[], params: PipelineParams, title: string): Lookbook {
  const paletteFor = (frame: SemanticFrame): string[] => {
    if (frame.time_of_day.includes("NIGHT")) return ["#0c0d10", "#c45c4a", "#d6b36a", "#8a93a0"];
    if (frame.time_of_day.includes("DAWN") || frame.time_of_day.includes("DUSK"))
      return ["#1a1410", "#c47a4a", "#e8dcc8", "#5c6a78"];
    return ["#d8d2c4", "#2a2c30", "#6a7368", "#b8a090"];
  };

  const logline =
    frames[0]?.synopsis ?? "A contained story told in precise coverage and withheld information.";

  return {
    title,
    logline,
    genre: params.genre,
    visual_thesis: `Photograph ${params.genre} as ${params.look}. Hold wide until the cut is earned. Close-ups are evidence, not decoration.`,
    color_script: frames.map((f) => ({
      scene_index: f.scene_index,
      heading: f.heading,
      palette: paletteFor(f),
      note: `${f.tone} · ${f.time_of_day.toLowerCase()}`,
    })),
    camera_grammar: [
      "Start every scene on geography. The audience should always know the walls.",
      "Masters are locked; coverage may breathe. Handheld is reserved for loss of control.",
      "Eyelines stay honest. Crossing the line is a narrative event, never a mistake.",
      "Inserts must advance plot or character — no texture for its own sake.",
    ],
    lighting_notes: [
      params.look,
      "Practicals motivated. Sodium, neon, and desk lamps before movie lights.",
      "Faces fall half into shadow unless a character is lying.",
    ],
    sound_notes: [
      "Production sound is the score until it isn't.",
      "Source radios, HVAC, rain, and distant traffic as architecture.",
      "Silence after violence — never a sting.",
    ],
    references: [
      "Wet asphalt, sodium vapor, rain on glass",
      "Academy-flat-ish framing inside the booth; wider in the structure",
      "Credits: condensed sans over black, no flourish",
    ],
  };
}

function buildEntities(frames: SemanticFrame[]): ProductionPackage["entities"] {
  const map = new Map<string, ProductionPackage["entities"][number]>();
  const add = (kind: EntityKind, name: string, scene: number, description: string) => {
    const key = `${kind}:${name.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) return;
    map.set(key, { kind, name, description, first_scene: scene, meta: {} });
  };
  for (const frame of frames) {
    for (const c of frame.entities.characters) {
      add("character", c, frame.scene_index, `Appears first in ${frame.heading}`);
    }
    for (const p of frame.entities.props) {
      add("prop", p, frame.scene_index, `Tracked prop · sc. ${frame.scene_index}`);
    }
    add("location", frame.location, frame.scene_index, `${frame.slugline_kind} ${frame.time_of_day}`);
    for (const v of frame.entities.vehicles) {
      add("vehicle", v, frame.scene_index, `Picture vehicle · sc. ${frame.scene_index}`);
    }
  }
  return [...map.values()];
}

export function buildProduction(scriptText: string, params: PipelineParams, title: string): ProductionPackage {
  const semantic = semanticAnalysis(scriptText);
  const cinematic = cinematicPlanning(semantic, params);
  return {
    frames: semantic.frames,
    plan: cinematic.plan,
    breakdown: buildBreakdown(semantic.frames),
    schedule: buildSchedule(semantic.frames),
    lookbook: buildLookbook(semantic.frames, params, title),
    entities: buildEntities(semantic.frames),
  };
}

export function budgetFromBreakdown(
  breakdown: { category: string; quantity: number }[],
  days: number,
): { total: number; lines: { category: string; amount: number }[] } {
  const unit: Record<string, number> = {
    CAST: 1800,
    EXTRAS: 250,
    PROPS: 80,
    WARDROBE: 220,
    MAKEUP: 400,
    VEHICLES: 650,
    SFX: 900,
    VFX: 1200,
    ANIMALS: 800,
    STUNTS: 1500,
    SPECIAL_EQ: 700,
    SET_DRESSING: 300,
    GREENS: 180,
    MUSIC: 500,
  };
  const byCat = new Map<string, number>();
  for (const row of breakdown) {
    const u = unit[row.category] ?? 100;
    const daysFactor = row.category === "CAST" || row.category === "MAKEUP" ? days : 1;
    byCat.set(row.category, (byCat.get(row.category) ?? 0) + u * row.quantity * daysFactor);
  }
  const crew = days * 4200;
  const locations = days * 1600;
  byCat.set("CREW", (byCat.get("CREW") ?? 0) + crew);
  byCat.set("LOCATIONS", (byCat.get("LOCATIONS") ?? 0) + locations);
  const lines = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { total, lines };
}
