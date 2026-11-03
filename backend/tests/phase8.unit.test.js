"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes, scrypt } = require("node:crypto");
const { promisify } = require("node:util");
const { showtimeStartMs, getMalaysiaNow } = require("../utils/showtime");
const { verifyPassword } = require("../auth/password");
const scryptAsync = promisify(scrypt);

test("Valid Malaysian showtime is converted to UTC milliseconds", () => {
  assert.equal(showtimeStartMs("2026-11-03", "15:30"), Date.parse("2026-11-03T07:30:00.000Z"));
});
test("Invalid dates, malformed times and non-existent dates are rejected", () => {
  for (const [date, time] of [
    ["03-11-2026", "15:30"], ["2026-11-03", "3:30"],
    ["2026-02-30", "15:30"], ["2026-11-03", "25:00"],
    [null, "15:30"], ["2026-11-03", null],
  ]) assert.ok(Number.isNaN(showtimeStartMs(date, time)), `${date} ${time}`);
});
test("February 29 is valid only in leap years", () => {
  assert.ok(Number.isFinite(showtimeStartMs("2028-02-29", "10:00")));
  assert.ok(Number.isNaN(showtimeStartMs("2027-02-29", "10:00")));
});
test("Malaysian clock helper returns YYYY-MM-DD and HH:mm", () => {
  const now = getMalaysiaNow();
  assert.match(now.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(now.time, /^\d{2}:\d{2}$/);
});
test("Password verification rejects malformed hashes", async () => {
  assert.equal(await verifyPassword("example", "plain-text-password"), false);
  assert.equal(await verifyPassword(null, ""), false);
  assert.equal(await verifyPassword("example", null), false);
});
test("Password verification accepts correct password and rejects incorrect password", async () => {
  const password = "ExampleStrongPassphrase!2026"; // Test fixture only, not a real credential
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64, {
    N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024
  });
  const stored = `scrypt$131072$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
  assert.equal(await verifyPassword(password, stored), true);
  assert.equal(await verifyPassword("incorrect-password", stored), false);
});
