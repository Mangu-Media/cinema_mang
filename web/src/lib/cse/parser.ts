import type { ParsedScene, SluglineKind } from "./types";

const SLUG =
  /^(INT\/EXT|INT\/EXT\.|I\/E|EST|INT|EXT)\.?\s+(.+?)\s*$/i;

const CHARACTER = /^([A-Z][A-Z0-9 .'\-]{1,40})(\s*\(.*\))?$/;
const PARENTHETICAL = /^\(.*\)$/;
const TRANSITION = /^(FADE IN:|FADE OUT\.|FADE TO BLACK\.|CUT TO:|SMASH CUT TO:|MATCH CUT TO:|DISSOLVE TO:|IRIS OUT\.)$/i;

function slugKind(raw: string): SluglineKind {
  const u = raw.toUpperCase().replace(/\./g, "");
  if (u.startsWith("INT/EXT") || u.startsWith("I/E")) return "INT/EXT";
  if (u.startsWith("EST")) return "EST";
  if (u.startsWith("EXT")) return "EXT";
  return "INT";
}

export function splitScenes(scriptText: string): ParsedScene[] {
  const text = scriptText.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const lines = text.split("\n");
  const scenes: ParsedScene[] = [];
  let current: ParsedScene | null = null;
  let bodyLines: string[] = [];

  function flush() {
    if (!current) return;
    current.body = bodyLines.join("\n").trim();
    parseBody(current);
    scenes.push(current);
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const slug = SLUG.exec(trimmed);
    if (slug) {
      flush();
      const rest = (slug[2] ?? "").trim();
      const split = rest.split(/\s*[-–—]\s*/);
      const loc = (split[0] ?? rest).trim();
      const tod = (split.slice(1).join(" - ") || "UNSPECIFIED").toUpperCase();
      current = {
        scene_index: scenes.length + 1,
        heading: trimmed.toUpperCase(),
        slugline_kind: slugKind(slug[1] ?? "INT"),
        location: loc || "UNSPECIFIED",
        time_of_day: tod,
        body: "",
        action: [],
        dialogue_blocks: [],
        transitions: [],
      };
      bodyLines = [];
      continue;
    }
    if (!current) {
      // Title page / preamble — skip until first slugline, unless there never is one
      continue;
    }
    bodyLines.push(line);
  }
  flush();

  if (scenes.length === 0) {
    const fallback: ParsedScene = {
      scene_index: 1,
      heading: "INT. UNSPECIFIED - DAY",
      slugline_kind: "INT",
      location: "UNSPECIFIED",
      time_of_day: "DAY",
      body: text,
      action: [],
      dialogue_blocks: [],
      transitions: [],
    };
    parseBody(fallback);
    return [fallback];
  }
  return scenes;
}

function isCharacterCue(line: string): boolean {
  if (line !== line.toUpperCase()) return false;
  if (line.length < 2 || line.length > 40) return false;
  if (line.endsWith(".") || line.endsWith(":")) return false;
  if (TRANSITION.test(line) || SLUG.test(line)) return false;
  if (/^(A|AN)\s+/.test(line)) return false;
  if (!CHARACTER.test(line)) return false;
  const words = line.replace(/\s*\(.*\)$/, "").trim().split(/\s+/);
  if (words.length > 4) return false;
  return true;
}

function parseBody(scene: ParsedScene) {
  const lines = scene.body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const t = raw.trim();
    if (!t) {
      i += 1;
      continue;
    }
    if (TRANSITION.test(t)) {
      scene.transitions.push(t.toUpperCase());
      i += 1;
      continue;
    }
    if (isCharacterCue(t)) {
      const m = CHARACTER.exec(t);
      const name = (m?.[1] ?? t).trim();
      i += 1;
      let parenthetical: string | undefined;
      if (i < lines.length && PARENTHETICAL.test((lines[i] ?? "").trim())) {
        parenthetical = (lines[i] ?? "").trim();
        i += 1;
      }
      const spoken: string[] = [];
      while (i < lines.length) {
        const next = (lines[i] ?? "").trim();
        if (!next) break;
        if (TRANSITION.test(next)) break;
        if (isCharacterCue(next)) break;
        if (SLUG.test(next)) break;
        spoken.push(next);
        i += 1;
      }
      scene.dialogue_blocks.push({
        character: name,
        parenthetical,
        lines: spoken.join(" "),
      });
      continue;
    }
    scene.action.push(t);
    i += 1;
  }
}

export function estimatePages(scene: ParsedScene): number {
  const chars = (scene.heading.length + scene.body.length) || 1;
  return Math.max(0.125, Math.round((chars / 1500) * 8) / 8);
}

export function estimateDurationS(pages: number): number {
  // ~1 page per minute of screen time for dialogue-heavy; slightly faster for action.
  return Math.round(pages * 55);
}
