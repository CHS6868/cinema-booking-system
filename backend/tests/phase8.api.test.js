"use strict";
// Integration tests run with a NEW temporary SQLite database.
// Never import a production DB before setting CINEMA_DB_PATH.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cinema-phase8-"));
process.env.CINEMA_TEST_MODE = "1";
process.env.CINEMA_DB_PATH = path.join(tempDir, "integration.db");
const db = require("../database/db");
const app = require("../server");

function futureLocalDate(days) {
  const time = new Date(Date.now() + days * 86400_000);
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit"
  });
  const parts = Object.fromEntries(f.formatToParts(time).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function initFixture() {
  // Never seed fixtures into the normal cinema.db, even if DB wiring changes.
  const opened = db.prepare("PRAGMA database_list").all().find(r => r.name === "main")?.file;
  assert.equal(path.resolve(opened || ""), path.resolve(process.env.CINEMA_DB_PATH),
    "Safety check failed: API tests are not using the temporary database");
  db.exec(fs.readFileSync(path.join(__dirname, "../database/schema.sql"), "utf8"));
  db.exec(`CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );`);
  db.exec(`
    INSERT INTO movies(id, title, genre, duration) VALUES (1, 'Integration Movie', 'Comedy', 95);
    INSERT INTO halls(id, name) VALUES (1, 'Hall A');
    INSERT INTO seats(id, hall_id, seat_label) VALUES
      (1, 1, 'A1'), (2, 1, 'A2'), (3, 1, 'B1'), (4, 1, 'B2');
  `);
  const ins = db.prepare("INSERT INTO showtimes(id, movie_id, hall_id, date, time, price_cents) VALUES (?, 1, 1, ?, '20:00', 1800)");
  ins.run(101, futureLocalDate(3));
  ins.run(102, futureLocalDate(-3));
}
async function request(base, endpoint, { method = "GET", cookie, body } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${base}${endpoint}`, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
  const result = await res.json().catch(() => null);
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, data: result, cookie: setCookie?.split(";")[0] };
}

test("Phase 8 API: registration, login, booking, authorization, cancellation and integrity", async (t) => {
  initFixture();
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const passA = "TestPassphraseA!2026";
  const passB = "TestPassphraseB!2026";
  let cookieA;
  let cookieB;
  let bookingIdA;
  try {
    await t.test("unregistered visitors cannot view personal bookings or book seats", async () => {
      assert.equal((await request(base, "/api/my-bookings")).status, 401);
      assert.equal((await request(base, "/api/bookings", {method:"POST", body:{showtimeId:101,seatIds:["A1"]}})).status, 401);
    });
    await t.test("registration validates inputs and creates distinct users", async () => {
      const invalid = await request(base, "/api/auth/register", {method:"POST", body:{email:"not-an-email",password:passA}});
      assert.equal(invalid.status, 400);
      const a = await request(base, "/api/auth/register", {method:"POST", body:{email:"FIRST@example.test",password:passA}});
      assert.equal(a.status, 201);
      assert.equal(a.data.user.email, "first@example.test");
      const b = await request(base, "/api/auth/register", {method:"POST", body:{email:"second@example.test",password:passB}});
      assert.equal(b.status, 201);
      assert.notEqual(a.data.user.id, b.data.user.id);
      const duplicate = await request(base, "/api/auth/register", {method:"POST", body:{email:"first@example.test",password:passA}});
      assert.equal(duplicate.status, 409);
      assert.notEqual(db.prepare("SELECT password_hash FROM users WHERE id=?").get(a.data.user.id).password_hash, passA);
    });
    await t.test("login handles wrong credentials and creates secure session cookies", async () => {
      const wrong = await request(base, "/api/auth/login", {method:"POST",body:{email:"first@example.test",password:"wrong-password"}});
      assert.equal(wrong.status, 401);
      const a = await request(base, "/api/auth/login", {method:"POST",body:{email:"first@example.test",password:passA}});
      const b = await request(base, "/api/auth/login", {method:"POST",body:{email:"second@example.test",password:passB}});
      assert.equal(a.status, 200);
      assert.equal(b.status, 200);
      assert.match(a.cookie, /^cinema_sid=[a-f0-9]{64}$/);
      cookieA = a.cookie;
      cookieB = b.cookie;
      const whoA = await request(base, "/api/auth/me", {cookie:cookieA});
      const whoB = await request(base, "/api/auth/me", {cookie:cookieB});
      assert.equal(whoA.data.user.email, "first@example.test");
      assert.equal(whoB.data.user.email, "second@example.test");
    });
    await t.test("movie, showtime and available-seat APIs return correct fixtures", async () => {
      const movies = await request(base, "/api/movies");
      assert.equal(movies.status, 200);
      assert.equal(movies.data[0].title, "Integration Movie");
      const movie = await request(base, "/api/movies/1");
      assert.equal(movie.status, 200);
      const showtimes = await request(base, "/api/movies/1/showtimes");
      assert.equal(showtimes.status, 200);
      assert.equal(showtimes.data.length, 1); // excludes past fixture
      const seats = await request(base, "/api/showtimes/101/seats");
      assert.equal(seats.status, 200);
      assert.ok(seats.data.seats.every(s => s.status === "available"));
    });
    await t.test("invalid booking data and expired showtimes are rejected", async () => {
      const badSeat = await request(base, "/api/bookings", {method:"POST",cookie:cookieA,body:{showtimeId:101,seatIds:["X99"]}});
      const duplicateInput = await request(base, "/api/bookings", {method:"POST",cookie:cookieA,body:{showtimeId:101,seatIds:["A1","A1"]}});
      const past = await request(base, "/api/bookings", {method:"POST",cookie:cookieA,body:{showtimeId:102,seatIds:["A1"]}});
      assert.equal(badSeat.status, 400);
      assert.equal(duplicateInput.status, 400);
      assert.equal(past.status, 400);
    });
    await t.test("booking is stored, double booking is blocked", async () => {
      const a = await request(base, "/api/bookings", {method:"POST",cookie:cookieA,body:{showtimeId:101,seatIds:["A1","A2"]}});
      assert.equal(a.status, 201);
      assert.equal(a.data.totalPrice, 36);
      bookingIdA = a.data.id;
      const conflict = await request(base, "/api/bookings", {method:"POST",cookie:cookieB,body:{showtimeId:101,seatIds:["A1"]}});
      assert.equal(conflict.status, 409);
    });
    await t.test("users cannot read or cancel another user's booking", async () => {
      const b = await request(base, "/api/my-bookings", {cookie:cookieB});
      assert.equal(b.status, 200);
      assert.equal(b.data.bookings.length, 0);
      const foreignCancel = await request(base, `/api/bookings/${bookingIdA}/cancel`, {method:"PATCH",cookie:cookieB});
      assert.equal(foreignCancel.status, 404);
      const a = await request(base, "/api/my-bookings", {cookie:cookieA});
      assert.equal(a.status, 200);
      assert.equal(a.data.bookings.length, 1);
    });
    await t.test("owner can cancel; seats return to available; repeat cancellation is blocked", async () => {
      const cancel = await request(base, `/api/bookings/${bookingIdA}/cancel`, {method:"PATCH",cookie:cookieA});
      assert.equal(cancel.status, 200);
      assert.equal(cancel.data.releasedSeats, 2);
      assert.equal((await request(base, `/api/bookings/${bookingIdA}/cancel`, {method:"PATCH",cookie:cookieA})).status, 409);
      const seats = await request(base, "/api/showtimes/101/seats");
      const statusMap = Object.fromEntries(seats.data.seats.map(s => [s.id,s.status]));
      assert.equal(statusMap.A1, "available");
      assert.equal(statusMap.A2, "available");
      const history = await request(base,"/api/my-bookings",{cookie:cookieA});
      assert.equal(history.data.bookings[0].status, "CANCELLED");
    });
    await t.test("second user can rebook released seat; database maintains integrity", async () => {
      const rebook = await request(base, "/api/bookings", {method:"POST",cookie:cookieB,body:{showtimeId:101,seatIds:["A1"]}});
      assert.equal(rebook.status, 201);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM booking_seats WHERE showtime_id=101 AND seat_id=1 AND status='CONFIRMED'").get().n, 1);
    });
    await t.test("logout invalidates the session", async () => {
      assert.equal((await request(base, "/api/auth/logout", {method:"POST",cookie:cookieA})).status, 200);
      assert.equal((await request(base, "/api/auth/me", {cookie:cookieA})).status, 401);
    });
  } finally {
    await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
    db.close();
    fs.rmSync(tempDir, {recursive:true,force:true});
  }
});
