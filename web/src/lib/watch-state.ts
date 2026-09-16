export type WatchState = {
  list: string[];
  progress: Record<string, number>;
};

const KEY = "cinema.stream.v1";

export function loadWatchState(): WatchState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { list: [], progress: {} };
    const parsed = JSON.parse(raw);
    return {
      list: Array.isArray(parsed.list) ? parsed.list : [],
      progress: parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {},
    };
  } catch {
    return { list: [], progress: {} };
  }
}

function save(state: WatchState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function toggleList(id: string): WatchState {
  const s = loadWatchState();
  s.list = s.list.includes(id) ? s.list.filter((x) => x !== id) : [id, ...s.list];
  save(s);
  return s;
}

export function setProgress(id: string, seconds: number): WatchState {
  const s = loadWatchState();
  s.progress = { ...s.progress, [id]: Math.max(0, Math.floor(seconds)) };
  save(s);
  return s;
}

export function continueWatching(): string[] {
  const s = loadWatchState();
  return Object.entries(s.progress)
    .filter(([, v]) => v > 8)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}
