import { test } from "node:test";
import assert from "node:assert/strict";
import { isUnlocked, LEVEL_SPECS, missingFields } from "../levels";

test("each level opens only after the previous one is finished", () => {
  assert.equal(isUnlocked(2, false, []), false);
  assert.equal(isUnlocked(2, true, []), true);
  assert.equal(isUnlocked(3, true, []), false);
  assert.equal(isUnlocked(3, true, [{ level: 2, status: "draft" }]), false);
  assert.equal(isUnlocked(3, true, [{ level: 2, status: "submitted" }]), true);
  assert.equal(isUnlocked(4, true, [{ level: 3, status: "approved" }]), true);
  assert.equal(isUnlocked(5, true, [{ level: 4, status: "rejected" }]), false);
});

test("a write-up can't be sent until every prompt meets its minimum", () => {
  const spec = LEVEL_SPECS[3];
  assert.ok(missingFields(spec, {}).length === spec.fields.length);
  const full = {
    who: "Ms. R, civil engineer at L&T",
    how: "Phone call",
    learned: "x".repeat(150),
    takeaway: "y".repeat(60),
  };
  assert.deepEqual(missingFields(spec, full), []);
  assert.equal(missingFields(spec, { ...full, how: "Telepathy" }).length, 1);
  assert.equal(missingFields(spec, { ...full, learned: "   short   " }).length, 1);
});

test("Level 2 course picks are limited to 1–3", () => {
  const spec = LEVEL_SPECS[2];
  const base = { jobs: "j".repeat(120), skills: "s".repeat(80), sources: "o".repeat(30) };
  assert.equal(missingFields(spec, { ...base, streams: [] }).length, 1);
  assert.equal(missingFields(spec, { ...base, streams: ["cs", "law", "media", "education"] }).length, 1);
  assert.deepEqual(missingFields(spec, { ...base, streams: ["cs"] }), []);
});
