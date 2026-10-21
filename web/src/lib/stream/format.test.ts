import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatClock,
  formatClockMin,
  formatPlayerClock,
  formatRuntime,
  remainingLabel,
} from "./format.ts";

describe("format", () => {
  it("formats runtime", () => {
    assert.equal(formatRuntime(8), "8m");
    assert.equal(formatRuntime(90), "1h 30m");
    assert.equal(formatRuntime(120), "2h");
    assert.equal(formatRuntime(0), "");
  });

  it("formats clocks", () => {
    assert.equal(formatClock(75), "01:15");
    assert.equal(formatClock(3661), "1:01:01");
    assert.equal(formatClockMin(0), "12:00 AM");
    assert.equal(formatClockMin(13 * 60 + 5), "1:05 PM");
  });

  it("remaining label", () => {
    assert.equal(remainingLabel(0.5, 100), "50m left");
  });

  it("player clock remaining uses a minus", () => {
    assert.equal(formatPlayerClock(10, 100, false), "00:10");
    assert.equal(formatPlayerClock(10, 100, true), "−01:30");
  });
});
