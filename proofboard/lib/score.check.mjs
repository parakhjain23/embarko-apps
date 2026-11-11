// Run: npm run check
import assert from "node:assert/strict";
import { week, report } from "./score.ts";

const today = "2026-11-11";
const days = ["2026-11-09", "2026-11-10", "2026-11-11"];
const t = (o) => ({ id: "x", text: "task", main: false, done: false, ...o });

// Twenty finished small tasks score nothing. One finished main goal scores one.
const busy = Array.from({ length: 20 }, () => t({ day: "2026-11-10", done: true }));
assert.equal(week(busy, today, days).done, 0);
assert.equal(week([t({ day: "2026-11-10", main: true, done: true, proof: "p" })], today, days).done, 1);

// A missed past goal counts against me; today's unfinished goal does not yet.
const w = week([t({ day: "2026-11-09", main: true }), t({ day: today, main: true })], today, days);
assert.deepEqual([w.done, w.set], [0, 1]);

assert.match(report("Sam", [t({ day: today, main: true, done: true, proof: "link", text: "Ship it" })], today, days), /Ship it[\s\S]*Proof: link[\s\S]*1 of 1/);
console.log("score checks pass");
