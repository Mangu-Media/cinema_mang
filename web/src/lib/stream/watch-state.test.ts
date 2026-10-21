import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { continueWatching, watchHistory } from "./watch-state.ts";
import type { WatchState } from "./types.ts";

const base: WatchState = {
  list: ["night-shift"],
  progress: {
    a: { titleId: "a", seconds: 40, duration: 100, updatedAt: 2 },
    b: { titleId: "b", seconds: 2, duration: 100, updatedAt: 3 },
    c: { titleId: "c", seconds: 95, duration: 100, updatedAt: 4 },
    d: { titleId: "d", seconds: 30, duration: 100, updatedAt: 1 },
  },
  volume: 1,
  muted: false,
  playbackRate: 1,
  ratings: {},
  dismissed: ["d"],
};

describe("watch-state selectors", () => {
  it("continue watching skips short, finished, and dismissed", () => {
    const rows = continueWatching(base);
    assert.deepEqual(
      rows.map((r) => r.titleId),
      ["a"],
    );
  });

  it("history is recency ordered", () => {
    const rows = watchHistory(base);
    assert.deepEqual(
      rows.map((r) => r.titleId),
      ["c", "b", "a", "d"],
    );
  });

  it("finished titles are watched (>= 92%)", () => {
    const finished = base.progress.c;
    assert.ok(finished.seconds / finished.duration >= 0.92);
  });
});
