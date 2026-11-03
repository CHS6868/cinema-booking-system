
const test = require("node:test");
const assert = require("node:assert/strict");

const { showtimeStartMs } = require("../utils/showtime");

test("Valid Malaysian showtime conversion", () => {
  const result = showtimeStartMs("2026-11-03", "15:30");

  const expected = Date.parse("2026-11-03T07:30:00Z");

  assert.equal(result, expected);
});

test("Invalid dates should be rejected", () => {
  const result = showtimeStartMs("2026-02-30", "15:30");

  assert.ok(Number.isNaN(result));
});

test("Invalid time should be rejected", () => {
  const result = showtimeStartMs("2026-11-03", "25:00");

  assert.ok(Number.isNaN(result));
});
