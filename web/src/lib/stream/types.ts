export const TITLE_ORIGINS = ["original", "public_domain"] as const;
export type TitleOrigin = (typeof TITLE_ORIGINS)[number];

export const TITLE_KINDS = ["film", "short", "series", "animatic"] as const;
export type TitleKind = (typeof TITLE_KINDS)[number];

export type TitleRating = "up" | "down";

export type StreamTitle = {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  year: number;
  runtimeMin: number;
  rating: "NR" | "G" | "PG" | "PG-13";
  kind: TitleKind;
  origin: TitleOrigin;
  genres: string[];
  director: string;
  cast: string[];
  poster: string;
  backdrop: string;
  trailer?: string;
  playback?: string;
  archiveId?: string;
  embedUrl?: string;
  player: "video" | "animatic" | "none";
  animaticJobId?: string;
  comingSoon?: boolean;
  featured?: boolean;
  badge?: string;
  collections: string[];
};

export type WatchProgress = {
  titleId: string;
  seconds: number;
  duration: number;
  updatedAt: number;
};

export type WatchState = {
  list: string[];
  progress: Record<string, WatchProgress>;
  volume: number;
  muted: boolean;
  playbackRate: number;
  ratings: Record<string, TitleRating>;
  dismissed: string[];
};

export const STREAM_ROWS: { id: string; label: string; subtitle?: string }[] = [
  { id: "continue", label: "Continue watching" },
  { id: "originals", label: "CINEMA Originals", subtitle: "Made on this floor" },
  { id: "new", label: "Recently added", subtitle: "New to the vault" },
  { id: "top10", label: "Top 10 in the vault" },
  { id: "trending", label: "Trending on CINEMA" },
  { id: "tonight", label: "Free tonight", subtitle: "A Tubi-style lineup of the vault" },
  { id: "silent", label: "Silent masters" },
  { id: "noir", label: "Night & noir" },
  { id: "horror", label: "Horror from the vault" },
  { id: "comedy", label: "Screwball & sight gags" },
  { id: "shorts", label: "Shorts under 20 minutes" },
  { id: "expressionist", label: "Bent light", subtitle: "German expressionist prints" },
  { id: "precode", label: "Pre-code", subtitle: "Before the Code bit down" },
  { id: "classics", label: "Public domain classics" },
];

export const STREAM_GENRES = [
  "horror",
  "noir",
  "silent",
  "comedy",
  "thriller",
  "romance",
  "science fiction",
  "animation",
  "documentary",
  "western",
] as const;

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export type RuntimeBucket = "short" | "feature" | "epic";
export type CatalogOrigin = TitleOrigin;
export type BrowseSort = "default" | "title" | "year" | "runtime";

export type CatalogQuery = {
  q?: string;
  genre?: string;
  decade?: string;
  origin?: CatalogOrigin;
  runtime?: RuntimeBucket;
  sort?: BrowseSort;
};
