export type StreamKind = "original" | "classic";

export type StreamTitle = {
  id: string;
  title: string;
  year: number;
  runtimeMin: number;
  synopsis: string;
  kind: StreamKind;
  genres: string[];
  ia?: string;
  file?: string;
  lockedJobId?: string;
};

export const STREAM_ROWS: { id: string; label: string; titleIds: string[] }[] = [
  { id: "originals", label: "CINEMA Originals", titleIds: ["night-shift", "last-reel", "sodium", "wet-down"] },
  { id: "continue", label: "Continue Watching", titleIds: [] },
  {
    id: "noir",
    label: "Night and Fog",
    titleIds: ["night-shift", "detour", "d-o-a", "the-stranger", "scarlett-street"],
  },
  {
    id: "vault",
    label: "The Vault — Public Domain",
    titleIds: [
      "night-of-the-living-dead",
      "nosferatu",
      "metropolis",
      "cabinet-dr-caligari",
      "his-girl-friday",
      "the-general",
      "charade",
      "plan-9",
    ],
  },
  {
    id: "silent",
    label: "Silent Grammar",
    titleIds: ["nosferatu", "metropolis", "cabinet-dr-caligari", "the-general", "sunrise"],
  },
];

export const STREAM_CATALOG: StreamTitle[] = [
  {
    id: "night-shift",
    title: "Night Shift",
    year: 2026,
    runtimeMin: 12,
    kind: "original",
    genres: ["drama", "procedural"],
    lockedJobId: "job_night_shift",
    synopsis: "A locked director animatic from the CSE floor. One precinct, one night, no score until the last hold.",
  },
  {
    id: "last-reel",
    title: "Last Reel",
    year: 2026,
    runtimeMin: 8,
    kind: "original",
    genres: ["drama"],
    synopsis: "A projectionist stays after close. The house lights never come up.",
  },
  {
    id: "sodium",
    title: "Sodium",
    year: 2026,
    runtimeMin: 9,
    kind: "original",
    genres: ["night"],
    synopsis: "Street lamps, wet asphalt, a walk that refuses to resolve.",
  },
  {
    id: "wet-down",
    title: "Wet Down",
    year: 2026,
    runtimeMin: 11,
    kind: "original",
    genres: ["procedural"],
    synopsis: "Engine company after the fire is out. Water, steam, inventory.",
  },
  {
    id: "night-of-the-living-dead",
    title: "Night of the Living Dead",
    year: 1968,
    runtimeMin: 96,
    kind: "classic",
    genres: ["horror"],
    ia: "night_of_the_living_dead",
    synopsis: "George A. Romero. Public domain. Farmhouse. Radio. No mercy cutaway.",
  },
  {
    id: "nosferatu",
    title: "Nosferatu",
    year: 1922,
    runtimeMin: 94,
    kind: "classic",
    genres: ["horror", "silent"],
    ia: "Nosferatu_1922",
    synopsis: "Murnau. Orlok crosses the water. Shadows do the acting.",
  },
  {
    id: "metropolis",
    title: "Metropolis",
    year: 1927,
    runtimeMin: 153,
    kind: "classic",
    genres: ["silent"],
    ia: "Metropolis_Restored_1927",
    synopsis: "Lang. The machine-city. Maria and the double.",
  },
  {
    id: "cabinet-dr-caligari",
    title: "The Cabinet of Dr. Caligari",
    year: 1920,
    runtimeMin: 76,
    kind: "classic",
    genres: ["silent", "horror"],
    ia: "TheCabinetOfDr.Caligari",
    synopsis: "Wiene. Painted streets. The somnambulist walks.",
  },
  {
    id: "his-girl-friday",
    title: "His Girl Friday",
    year: 1940,
    runtimeMin: 92,
    kind: "classic",
    genres: ["comedy"],
    ia: "his_girl_friday",
    synopsis: "Hawks. Overlap dialogue. Newsroom velocity.",
  },
  {
    id: "the-general",
    title: "The General",
    year: 1926,
    runtimeMin: 79,
    kind: "classic",
    genres: ["silent", "comedy"],
    ia: "TheGeneral",
    synopsis: "Keaton and a locomotive. Geometry over gag.",
  },
  {
    id: "charade",
    title: "Charade",
    year: 1963,
    runtimeMin: 113,
    kind: "classic",
    genres: ["thriller"],
    ia: "Charade1963",
    synopsis: "Donen. Paris. A widow and four men who want a stamp.",
  },
  {
    id: "plan-9",
    title: "Plan 9 from Outer Space",
    year: 1957,
    runtimeMin: 79,
    kind: "classic",
    genres: ["science-fiction"],
    ia: "Plan_9_from_Outer_Space_1959",
    synopsis: "Wood. Cardboard tombs. Still the cut is honest about what it is.",
  },
  {
    id: "detour",
    title: "Detour",
    year: 1945,
    runtimeMin: 68,
    kind: "classic",
    genres: ["noir"],
    ia: "Detour_1945",
    synopsis: "Ulmer. A hitchhike that cannot be walked back.",
  },
  {
    id: "d-o-a",
    title: "D.O.A.",
    year: 1949,
    runtimeMin: 83,
    kind: "classic",
    genres: ["noir"],
    ia: "DOA_1949_movie",
    synopsis: "Mate. A man reports his own murder.",
  },
  {
    id: "the-stranger",
    title: "The Stranger",
    year: 1946,
    runtimeMin: 95,
    kind: "classic",
    genres: ["noir"],
    ia: "TheStranger",
    synopsis: "Welles. A clock tower and a man who should not be in Connecticut.",
  },
  {
    id: "scarlett-street",
    title: "Scarlet Street",
    year: 1945,
    runtimeMin: 102,
    kind: "classic",
    genres: ["noir"],
    ia: "ScarletStreet",
    synopsis: "Lang again. Paintings, a cashier, a lie that sticks.",
  },
  {
    id: "sunrise",
    title: "Sunrise: A Song of Two Humans",
    year: 1927,
    runtimeMin: 94,
    kind: "classic",
    genres: ["silent"],
    ia: "Sunrise_1927",
    synopsis: "Murnau. City light against a lake. The camera breathes.",
  },
];

export function getTitle(id: string): StreamTitle | undefined {
  return STREAM_CATALOG.find((t) => t.id === id);
}

export function searchTitles(q: string): StreamTitle[] {
  const n = q.trim().toLowerCase();
  if (!n) return STREAM_CATALOG;
  return STREAM_CATALOG.filter(
    (t) =>
      t.title.toLowerCase().includes(n) ||
      t.synopsis.toLowerCase().includes(n) ||
      t.genres.some((g) => g.includes(n)) ||
      String(t.year) === n,
  );
}

export function titlesForRow(rowId: string, extraIds: string[] = []): StreamTitle[] {
  const row = STREAM_ROWS.find((r) => r.id === rowId);
  const ids = rowId === "continue" ? extraIds : row?.titleIds || [];
  return ids.map(getTitle).filter((t): t is StreamTitle => Boolean(t));
}

export function similarTo(id: string): StreamTitle[] {
  const t = getTitle(id);
  if (!t) return STREAM_CATALOG.slice(0, 6);
  return STREAM_CATALOG.filter((o) => o.id !== id && o.genres.some((g) => t.genres.includes(g))).slice(0, 8);
}

export function iaEmbed(ia: string): string {
  return `https://archive.org/embed/${encodeURIComponent(ia)}`;
}

export function iaThumb(ia: string): string {
  return `https://archive.org/services/img/${encodeURIComponent(ia)}`;
}

export function formatRuntime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
