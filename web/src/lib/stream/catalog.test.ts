import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STREAM_CATALOG,
  allGenres,
  canPlay,
  getTitle,
  playableTitles,
  searchTitles,
  similarTo,
  titlesForRow,
  titlesIn,
} from "./catalog.ts";
import { sortTitles, surprisePick } from "./recommend.ts";

describe("catalog", () => {
  it("has unique ids", () => {
    const ids = STREAM_CATALOG.map((t) => t.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("only contains originals or public-domain titles", () => {
    for (const t of STREAM_CATALOG) {
      assert.ok(t.origin === "original" || t.origin === "public_domain", t.id);
      assert.ok(t.title.length > 0, t.id);
      assert.ok(t.year > 1800 && t.year < 2100, t.id);
    }
  });

  it("looks up Night Shift", () => {
    const t = getTitle("night-shift");
    assert.ok(t);
    assert.equal(t.player, "animatic");
    assert.equal(t.origin, "original");
  });

  it("search matches year and director", () => {
    assert.ok(searchTitles("1922").some((t) => t.id === "nosferatu"));
    assert.ok(searchTitles("murnau").some((t) => t.id === "nosferatu"));
    assert.equal(searchTitles("   ").length, 0);
  });

  it("similar prefers shared genres and director", () => {
    const seed = getTitle("detour");
    assert.ok(seed);
    const recs = similarTo(seed, 6);
    assert.ok(recs.length > 0);
    assert.ok(recs.every((t) => t.id !== "detour"));
    const murnau = getTitle("nosferatu")!;
    const also = similarTo(murnau, 8);
    assert.ok(also.some((t) => t.director.includes("Murnau")));
  });

  it("playable excludes coming soon and none", () => {
    assert.ok(!playableTitles().some((t) => t.comingSoon || t.player === "none"));
    assert.equal(canPlay(getTitle("sodium")!), false);
    assert.equal(canPlay(getTitle("night-shift")!), true);
  });

  it("collections, decades, top ten, and genres exist", () => {
    assert.ok(titlesIn("originals").length >= 4);
    assert.ok(titlesIn("new").length >= 4);
    assert.ok(allGenres().includes("horror"));
    assert.ok(titlesForRow("1920s").every((t) => t.year >= 1920 && t.year < 1930));
    assert.equal(titlesForRow("top10").length, 10);
    assert.ok(titlesForRow("expressionist").some((t) => t.id === "caligari"));
    assert.ok(titlesForRow("precode").some((t) => t.id === "white-zombie"));
    assert.ok(getTitle("sunrise"));
    assert.ok(getTitle("gold-rush"));
    assert.ok(getTitle("big-combo"));
  });

  it("sorts by year descending", () => {
    const sorted = sortTitles(STREAM_CATALOG, "year");
    assert.ok(sorted[0].year >= sorted[sorted.length - 1].year);
  });

  it("surprise pick is playable", () => {
    const pick = surprisePick();
    assert.ok(pick);
    assert.equal(canPlay(pick), true);
  });
});
