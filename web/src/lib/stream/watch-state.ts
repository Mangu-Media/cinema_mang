import { useEffect, useState } from "react";
import type { TitleRating, WatchProgress, WatchState } from "./types.ts";

const KEY = "cinema.stream.v1";
const EVENT = "cinema-stream";

function empty(): WatchState {
  return { list: [], progress: {}, volume: 1, muted: false, playbackRate: 1, ratings: {}, dismissed: [] };
}

export function loadWatchState(): WatchState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<WatchState>;
    return {
      list: Array.isArray(parsed.list) ? parsed.list : [],
      progress: parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {},
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : 1,
      muted: Boolean(parsed.muted),
      playbackRate:
        typeof parsed.playbackRate === "number" && parsed.playbackRate > 0
          ? Math.min(2, Math.max(0.5, parsed.playbackRate))
          : 1,
      ratings: parsed.ratings && typeof parsed.ratings === "object" ? parsed.ratings : {},
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
    };
  } catch {
    return empty();
  }
}

function save(state: WatchState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
}

export function toggleList(titleId: string): WatchState {
  const state = loadWatchState();
  state.list = state.list.includes(titleId)
    ? state.list.filter((id) => id !== titleId)
    : [titleId, ...state.list];
  save(state);
  return state;
}

export function setProgress(titleId: string, seconds: number, duration: number): WatchState {
  const state = loadWatchState();
  state.progress[titleId] = { titleId, seconds, duration, updatedAt: Date.now() };
  state.dismissed = state.dismissed.filter((id) => id !== titleId);
  save(state);
  return state;
}

export function clearProgress(titleId: string): WatchState {
  const state = loadWatchState();
  delete state.progress[titleId];
  if (!state.dismissed.includes(titleId)) state.dismissed = [titleId, ...state.dismissed];
  save(state);
  return state;
}

export function restartTitle(titleId: string): WatchState {
  const state = loadWatchState();
  delete state.progress[titleId];
  state.dismissed = state.dismissed.filter((id) => id !== titleId);
  save(state);
  return state;
}

export function markWatched(titleId: string, durationSec: number): WatchState {
  const dur = Math.max(1, durationSec);
  return setProgress(titleId, dur, dur);
}

export function setVolumePrefs(volume: number, muted: boolean): WatchState {
  const state = loadWatchState();
  state.volume = Math.min(1, Math.max(0, volume));
  state.muted = muted;
  save(state);
  return state;
}

export function setPlaybackRate(rate: number): WatchState {
  const state = loadWatchState();
  state.playbackRate = Math.min(2, Math.max(0.5, rate));
  save(state);
  return state;
}

export function setRating(titleId: string, rating: TitleRating | null): WatchState {
  const state = loadWatchState();
  if (!rating || state.ratings[titleId] === rating) delete state.ratings[titleId];
  else state.ratings[titleId] = rating;
  save(state);
  return state;
}

export function continueWatching(state: WatchState = loadWatchState()): WatchProgress[] {
  return Object.values(state.progress)
    .filter(
      (p) =>
        p.duration > 20 &&
        p.seconds > 8 &&
        p.seconds / p.duration < 0.92 &&
        !state.dismissed.includes(p.titleId),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function watchHistory(state: WatchState = loadWatchState()): WatchProgress[] {
  return Object.values(state.progress).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useWatchState() {
  const [state, setState] = useState<WatchState>(empty);

  useEffect(() => {
    const sync = () => setState(loadWatchState());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}
