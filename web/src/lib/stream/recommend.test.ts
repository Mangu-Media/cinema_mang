import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STREAM_CATALOG } from "./catalog.ts";
import { becauseYouLiked, becauseYouWatched, nextUp, sortTitles } from "./recommend.ts";
import type { WatchState } from "./types.ts";

function state(over: Partial<WatchState> = {}): WatchState {
  return {
    list: [],
    progress: {},
    volume: 1,
    muted: false,
    playbackRate: 1,
    ratings: {},
    dismissed: [],
    ...over,
  };
}

describe("recommend", () => {
  it("returns similar titles for a watched seed", () => {
    const rec = becauseYouWatched(
      state({
        progress: {
          detour: { titleId: "detour", seconds: 20, duration: 100, updatedAt: Date.now() },
        },
      }),
    );
    assert.ok(rec);
    assert.equal(rec.seed.id, "detour");
    assert.ok(rec.recs.length > 0);
    assert.ok(rec.recs.every((t) => t.id !== "detour"));
  });

  it("skips downvoted seeds for because-you-watched", () => {
    const rec = becauseYouWatched(
      state({
        progress: {
          detour: { titleId: "detour", seconds: 20, duration: 100, updatedAt: Date.now() },
        },
        ratings: { detour: "down" },
      }),
    );
    assert.equal(rec, null);
  });

  it("because-you-liked uses thumbs-up", () => {
    const rec = becauseYouLiked(state({ ratings: { nosferatu: "up" } }));
    assert.ok(rec);
    assert.equal(rec.seed.id, "nosferatu");
    assert.ok(rec.recs.every((t) => t.id !== "nosferatu"));
  });

  it("next-up is playable and different", () => {
    const seed = STREAM_CATALOG.find((t) => t.id === "notld")!;
    const n = nextUp(seed);
    assert.ok(n);
    assert.notEqual(n.id, seed.id);
  });

  it("sort by title is stable alphabetical", () => {
    const sorted = sortTitles(STREAM_CATALOG.slice(0, 8), "title");
    const titles = sorted.map((t) => t.title);
    assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b)));
  });
});
