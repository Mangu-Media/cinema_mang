import { canPlay, getTitle, playableTitles, similarTo } from "./catalog.ts";
import { downvotedIds, likedIds } from "./catalog-query.ts";
import type { BrowseSort, StreamTitle, WatchState } from "./types.ts";
import { watchHistory } from "./watch-state.ts";

export type { BrowseSort };

export function becauseYouWatched(state: WatchState): { seed: StreamTitle; recs: StreamTitle[] } | null {
  const down = downvotedIds(state);
  const recent = watchHistory(state).find((p) => getTitle(p.titleId) && !down.has(p.titleId));
  if (!recent) return null;
  const seed = getTitle(recent.titleId);
  if (!seed) return null;
  const recs = similarTo(seed, 14).filter((t) => canPlay(t) && !down.has(t.id));
  if (!recs.length) return null;
  return { seed, recs };
}

export function becauseYouLiked(state: WatchState): { seed: StreamTitle; recs: StreamTitle[] } | null {
  const down = downvotedIds(state);
  const liked = likedIds(state)
    .map((id) => getTitle(id))
    .filter((t): t is StreamTitle => Boolean(t));
  const seed = liked[0];
  if (!seed) return null;
  const recs = similarTo(seed, 14).filter((t) => canPlay(t) && !down.has(t.id) && t.id !== seed.id);
  if (!recs.length) return null;
  return { seed, recs };
}

export function surprisePick(excludeId?: string): StreamTitle | undefined {
  const filtered = playableTitles().filter((t) => t.id !== excludeId);
  if (!filtered.length) return undefined;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function nextUp(title: StreamTitle): StreamTitle | undefined {
  return similarTo(title, 12).find((t) => canPlay(t) && t.id !== title.id);
}

export function sortTitles(titles: StreamTitle[], sort: BrowseSort): StreamTitle[] {
  const copy = titles.slice();
  if (sort === "title") copy.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "year") copy.sort((a, b) => b.year - a.year);
  else if (sort === "runtime") copy.sort((a, b) => a.runtimeMin - b.runtimeMin);
  return copy;
}
