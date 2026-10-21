import {
  STREAM_CATALOG,
  playableTitles,
  searchTitles,
} from "./catalog.ts";
import type {
  BrowseSort,
  CatalogQuery,
  RuntimeBucket,
  StreamTitle,
  WatchState,
} from "./types.ts";

export function decadeOf(year: number) {
  return `${Math.floor(year / 10) * 10}s`;
}

export function parseDecade(id: string): number | null {
  const m = /^(\d{3,4})s$/.exec(id.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return n < 1000 ? n * 10 : n;
}

export function allDecades() {
  return [...new Set(STREAM_CATALOG.map((t) => decadeOf(t.year)))].sort();
}

export function runtimeBucket(min: number): RuntimeBucket {
  if (min < 40) return "short";
  if (min >= 120) return "epic";
  return "feature";
}

export function creditSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitCredits(raw: string) {
  return raw
    .split(/\s*(?:,|&|\/| and )\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type Credit = { name: string; slug: string; role: "director" | "cast" };

export function creditsOf(title: StreamTitle): Credit[] {
  const dirs = splitCredits(title.director).map((name) => ({
    name,
    slug: creditSlug(name),
    role: "director" as const,
  }));
  const cast = title.cast.map((name) => ({
    name,
    slug: creditSlug(name),
    role: "cast" as const,
  }));
  return [...dirs, ...cast].filter((c) => c.slug);
}

export type Person = {
  name: string;
  slug: string;
  titles: StreamTitle[];
  directed: number;
  appeared: number;
};

export function allPeople(): Person[] {
  const map = new Map<string, Person>();
  for (const title of STREAM_CATALOG) {
    for (const credit of creditsOf(title)) {
      const rec =
        map.get(credit.slug) ??
        ({
          name: credit.name,
          slug: credit.slug,
          titles: [],
          directed: 0,
          appeared: 0,
        } satisfies Person);
      if (!rec.titles.some((t) => t.id === title.id)) rec.titles.push(title);
      if (credit.role === "director") rec.directed += 1;
      else rec.appeared += 1;
      map.set(credit.slug, rec);
    }
  }
  return [...map.values()].sort((a, b) => b.titles.length - a.titles.length || a.name.localeCompare(b.name));
}

export function getPerson(slug: string) {
  return allPeople().find((p) => p.slug === slug);
}

export function filterCatalog(query: CatalogQuery): StreamTitle[] {
  let rows = STREAM_CATALOG.slice();
  if (query.q?.trim()) {
    const hit = new Set(searchTitles(query.q).map((t) => t.id));
    rows = rows.filter((t) => hit.has(t.id));
  }
  if (query.genre) {
    const g = query.genre.toLowerCase();
    rows = rows.filter(
      (t) =>
        t.genres.some((x) => x.toLowerCase() === g) ||
        t.collections.some((x) => x.toLowerCase() === g),
    );
  }
  if (query.decade) {
    const start = parseDecade(query.decade);
    if (start != null) rows = rows.filter((t) => t.year >= start && t.year < start + 10);
  }
  if (query.origin) rows = rows.filter((t) => t.origin === query.origin);
  if (query.runtime) rows = rows.filter((t) => runtimeBucket(t.runtimeMin) === query.runtime);
  return sortCatalog(rows, query.sort ?? "default");
}

export function sortCatalog(titles: StreamTitle[], sort: BrowseSort): StreamTitle[] {
  const copy = titles.slice();
  if (sort === "title") copy.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "year") copy.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  else if (sort === "runtime") copy.sort((a, b) => a.runtimeMin - b.runtimeMin || a.title.localeCompare(b.title));
  return copy;
}

export function topTenTitles(limit = 10): StreamTitle[] {
  return playableTitles()
    .map((t) => ({
      t,
      score:
        (t.featured ? 8 : 0) +
        (t.collections.includes("trending") ? 5 : 0) +
        (t.origin === "original" && !t.comingSoon ? 4 : 0) +
        (t.collections.includes("tonight") ? 2 : 0) +
        (t.runtimeMin >= 60 ? 1 : 0) +
        Math.min(2, t.cast.length),
    }))
    .sort((a, b) => b.score - a.score || a.t.title.localeCompare(b.t.title))
    .slice(0, limit)
    .map((x) => x.t);
}

export function skipOpeningSeconds(title: StreamTitle) {
  if (title.runtimeMin < 40) return null;
  if (title.origin === "original") return 8;
  return 18;
}

export function downvotedIds(state: WatchState) {
  return new Set(
    Object.entries(state.ratings)
      .filter(([, r]) => r === "down")
      .map(([id]) => id),
  );
}

export function likedIds(state: WatchState) {
  return Object.entries(state.ratings)
    .filter(([, r]) => r === "up")
    .map(([id]) => id);
}

export function isWatched(seconds: number, duration: number) {
  return duration > 0 && seconds / duration >= 0.92;
}

export function progressRatio(seconds: number, duration: number) {
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, seconds / duration));
}

