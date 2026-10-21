import type { JobStatus, PipelineStage, ShotType } from "./types";

export function formatTimecode(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

export function formatPages(pages: number): string {
  const n = Number(pages);
  if (!Number.isFinite(n)) return "0";
  const eighths = Math.round(n * 8) / 8;
  const whole = Math.floor(eighths);
  const frac = eighths - whole;
  const labels: Record<number, string> = {
    0: "",
    0.125: "1/8",
    0.25: "1/4",
    0.375: "3/8",
    0.5: "1/2",
    0.625: "5/8",
    0.75: "3/4",
    0.875: "7/8",
  };
  const f = labels[frac] ?? "";
  if (!whole && f) return f;
  if (!f) return `${whole}`;
  return `${whole} ${f}`;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function shotTypeLabel(type: string): string {
  return type.replaceAll("_", " ");
}

export function stageLabel(stage: PipelineStage | string): string {
  const map: Record<string, string> = {
    ingest: "Ingest",
    semantic: "Semantic",
    cinematic: "Cinematic",
    breakdown: "Breakdown",
    schedule: "Schedule",
    look: "Look",
    complete: "Lock",
  };
  return map[stage] ?? stage;
}

export function statusLabel(status: JobStatus | string): string {
  const map: Record<string, string> = {
    PENDING: "Queued",
    RUNNING: "Running",
    SUCCEEDED: "Locked",
    FAILED: "Failed",
  };
  return map[status] ?? status;
}

export function parseJson<T>(value: T | string, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function asNumber(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function stripColor(kind: string, tod: string): string {
  const night = /NIGHT|DUSK|DAWN|EVENING|MAGIC/.test(tod.toUpperCase());
  if (kind === "EXT" || kind === "EST") return night ? "strip-ext-night" : "strip-ext-day";
  if (kind === "INT/EXT") return night ? "strip-ie-night" : "strip-ie-day";
  return night ? "strip-int-night" : "strip-int-day";
}

export const SHOT_TYPE_META: Record<
  ShotType | string,
  { short: string; aspect: string }
> = {
  WIDE: { short: "WS", aspect: "wide" },
  MEDIUM: { short: "MS", aspect: "mid" },
  CLOSE_UP: { short: "CU", aspect: "cu" },
  EXTREME_CLOSE_UP: { short: "ECU", aspect: "ecu" },
  INSERT: { short: "INS", aspect: "insert" },
  POV: { short: "POV", aspect: "cu" },
  TWO_SHOT: { short: "2S", aspect: "mid" },
  OVER_SHOULDER: { short: "OTS", aspect: "mid" },
  AERIAL: { short: "AER", aspect: "wide" },
  TRACKING: { short: "TRK", aspect: "wide" },
};
