import { test } from "node:test";
import assert from "node:assert/strict";
import { computeResults, emptyAnswers, IncompleteAnswersError } from "../scoring";
import { streams } from "../content/data";

function full(interest: number) {
  const a = emptyAnswers();
  a.orientation = a.orientation.map((_, i) => i % 4); // spread choices
  a.personality = a.personality.map(() => 0);
  a.riasec = a.riasec.map(() => 2);
  for (const s of streams) a.interest[s.id] = interest;
  return a;
}

test("rejects unanswered questions instead of defaulting them", () => {
  const a = full(50);
  a.riasec[3] = null;
  assert.throws(() => computeResults(a), IncompleteAnswersError);
});

test("scores never exceed 100 and are not capped into ties", () => {
  const a = full(100);
  a.riasec = a.riasec.map(() => 4);
  const r = computeResults(a);
  for (const m of r.matches) assert.ok(m.score <= 100);
  // With everything maxed, differences come only from style/personality — scores must still differ.
  assert.ok(new Set(r.matches.map((m) => m.score)).size > 1);
});

test("a stream rated higher always outranks one rated lower when other inputs are equal", () => {
  const a = full(40);
  a.interest.law = 90;
  const r = computeResults(a);
  const law = r.matches.findIndex((m) => m.id === "law");
  const peers = r.matches.filter((m) => streams.find((s) => s.id === m.id)!.arch === "strategist");
  assert.equal(r.matches.indexOf(peers[0]) <= law, true);
  assert.equal(peers[0].id, "law");
});

test("tied working styles are reported as ties, not resolved by list order", () => {
  const a = full(50);
  a.orientation = [0, 1, 0, 1, 2, 3].map((x) => x); // indices differ per question; check leaders length
  const r = computeResults(a);
  const top = r.orientation[0].count;
  assert.deepEqual(r.orientationLeaders.length, r.orientation.filter((o) => o.count === top).length);
});

test("same answers always give the same result", () => {
  assert.deepEqual(computeResults(full(60)), computeResults(full(60)));
});
