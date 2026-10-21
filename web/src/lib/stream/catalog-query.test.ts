import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STREAM_CATALOG, getTitle } from "./catalog.ts";
import {
  allDecades,
  allPeople,
  creditSlug,
  decadeOf,
  filterCatalog,
  getPerson,
  parseDecade,
  runtimeBucket,
  skipOpeningSeconds,
  topTenTitles,
} from "./catalog-query.ts";

describe("catalog-query", () => {
  it("maps years to decades", () => {
    assert.equal(decadeOf(1927), "1920s");
    assert.equal(decadeOf(1902), "1900s");
    assert.equal(parseDecade("1920s"), 1920);
    assert.equal(parseDecade("noir"), null);
    assert.ok(allDecades().includes("1920s"));
  });

  it("buckets runtime", () => {
    assert.equal(runtimeBucket(12), "short");
    assert.equal(runtimeBucket(90), "feature");
    assert.equal(runtimeBucket(153), "epic");
  });

  it("slugs credits and finds Murnau", () => {
    assert.equal(creditSlug("F. W. Murnau"), "f-w-murnau");
    const person = getPerson("f-w-murnau");
    assert.ok(person);
    assert.ok(person.titles.length >= 2);
    assert.ok(person.directed >= 2);
  });

  it("filters by decade, origin, and runtime", () => {
    const silentTwenties = filterCatalog({ decade: "1920s", genre: "silent" });
    assert.ok(silentTwenties.length >= 5);
    assert.ok(silentTwenties.every((t) => t.year >= 1920 && t.year < 1930));

    const originals = filterCatalog({ origin: "original" });
    assert.ok(originals.every((t) => t.origin === "original"));

    const shorts = filterCatalog({ runtime: "short" });
    assert.ok(shorts.every((t) => t.runtimeMin < 40));
  });

  it("search plus genre intersects", () => {
    const rows = filterCatalog({ q: "keaton", genre: "comedy" });
    assert.ok(rows.some((t) => t.id === "general" || t.id === "one-week"));
  });

  it("top ten is playable and unique", () => {
    const top = topTenTitles();
    assert.equal(top.length, 10);
    assert.equal(new Set(top.map((t) => t.id)).size, 10);
    assert.ok(top.every((t) => t.player !== "none" && !t.comingSoon));
  });

  it("skip opening only on longer titles", () => {
    const night = getTitle("night-shift")!;
    const nosferatu = getTitle("nosferatu")!;
    assert.equal(skipOpeningSeconds(night), null);
    assert.equal(skipOpeningSeconds(nosferatu), 18);
  });

  it("people index covers the catalog", () => {
    const people = allPeople();
    assert.ok(people.length > 20);
    const keaton = people.find((p) => p.slug === "buster-keaton");
    assert.ok(keaton);
    assert.ok(keaton.titles.length >= 3);
    assert.equal(
      STREAM_CATALOG.every((t) => t.origin === "original" || t.origin === "public_domain"),
      true,
    );
  });
});
