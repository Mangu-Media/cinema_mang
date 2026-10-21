import { getTitle } from "./catalog";
import type { StreamTitle } from "./types";

const LOOP = [
  "night-shift",
  "notld",
  "detour",
  "charade",
  "carnival",
  "nosferatu",
  "godfrey",
  "little-shop",
  "haunted-hill",
  "general",
  "phantom",
  "wet-down",
  "caligari",
  "doa",
  "last-man",
  "sherlock-jr",
];

export type TonightSlot = {
  title: StreamTitle;
  startMin: number;
  endMin: number;
};

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

export function tonightLineup(now = new Date()): TonightSlot[] {
  const titles = LOOP.map((id) => getTitle(id)).filter((t): t is StreamTitle => Boolean(t));
  if (!titles.length) return [];
  const offset = dayOfYear(now) % titles.length;
  const slots: TonightSlot[] = [];
  let cursor = 0;
  let i = offset;
  while (cursor < 24 * 60) {
    const title = titles[i % titles.length];
    const startMin = cursor;
    const endMin = Math.min(cursor + title.runtimeMin, 24 * 60);
    slots.push({ title, startMin, endMin });
    cursor = endMin + 6;
    i += 1;
    if (endMin >= 24 * 60) break;
  }
  return slots;
}

export function minutesNow(now = new Date()) {
  return now.getHours() * 60 + now.getMinutes();
}

export function onNow(now = new Date()) {
  const mins = minutesNow(now);
  const lineup = tonightLineup(now);
  return lineup.find((s) => mins >= s.startMin && mins < s.endMin) ?? lineup[0];
}

export function upcomingSlots(now = new Date(), count = 8) {
  const mins = minutesNow(now);
  const lineup = tonightLineup(now);
  const start = lineup.findIndex((s) => s.endMin > mins);
  const from = start < 0 ? 0 : start;
  return lineup.slice(from, from + count);
}
