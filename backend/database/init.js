const fs = require("node:fs");
const path = require("node:path");
const db = require("./db");

const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

// Debug: inspect SQL file
console.log("Schema file path:", schemaPath);
console.log("Schema length:", schema.length);
console.log("First 200 characters:");
console.log(schema.slice(0, 200));

// Execute schema
db.exec(schema);

// Debug: check actual SQLite tables
const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  ORDER BY name
`).all();

console.log("Actual database tables:", tables);

if (!tables.some(table => table.name === "movies")) {
  throw new Error(
    "The movies table was not created. Check schema.sql."
  );
}

console.log("Database tables created successfully.");


// Insert sample movies
const insertMovie = db.prepare(`
  INSERT OR IGNORE INTO movies
  (id, title, genre, duration)
  VALUES (?, ?, ?, ?)
`);

insertMovie.run(1, "Movie A", "Action", 120);
insertMovie.run(2, "Movie B", "Comedy", 105);
insertMovie.run(3, "Movie C", "Horror", 110);

// Insert halls
const insertHall = db.prepare(`
  INSERT OR IGNORE INTO halls (id, name)
  VALUES (?, ?)
`);

insertHall.run(1, "Hall 1");
insertHall.run(2, "Hall 2");
insertHall.run(3, "Hall 3");

// Insert seats (A1 to D6) for each hall
const insertSeat = db.prepare(`
  INSERT OR IGNORE INTO seats
  (hall_id, seat_label)
  VALUES (?, ?)
`);

for (let hallId = 1; hallId <= 3; hallId++) {
  for (const row of ["A", "B", "C", "D"]) {
    for (let number = 1; number <= 6; number++) {
      insertSeat.run(hallId, `${row}${number}`);
    }
  }
}

// Use local calendar dates for demo showtimes
function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const insertShowtime = db.prepare(`
  INSERT OR IGNORE INTO showtimes
  (id, movie_id, hall_id, date, time, price_cents)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const tomorrow = futureDate(1);
const dayAfter = futureDate(2);

insertShowtime.run(101, 1, 1, tomorrow, "14:00", 1800);
insertShowtime.run(102, 1, 1, tomorrow, "19:00", 1800);
insertShowtime.run(103, 1, 2, dayAfter, "20:00", 2000);

insertShowtime.run(201, 2, 2, tomorrow, "12:00", 1800);
insertShowtime.run(202, 2, 1, dayAfter, "17:00", 1800);

insertShowtime.run(301, 3, 3, tomorrow, "21:00", 2000);
insertShowtime.run(302, 3, 3, dayAfter, "21:00", 2000);

console.log("Initial data inserted.");

// Verify data
const movies = db.prepare("SELECT * FROM movies").all();
const showtimes = db.prepare("SELECT * FROM showtimes").all();
const seatCount = db.prepare(
  "SELECT COUNT(*) AS count FROM seats"
).get();

console.log("Movies:", movies);
console.log("Showtime count:", showtimes.length);
console.log("Seat count:", seatCount.count);

db.close();
