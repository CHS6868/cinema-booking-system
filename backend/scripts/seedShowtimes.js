
const db = require("../database/db");

// Movie schedules
// Movie IDs and Hall IDs must exist in SQLite
const schedules = [
  {
    movieId: 1,
    hallId: 1,
    priceCents: 1800,
    times: ["10:00", "13:00", "16:00", "19:00", "22:00"]
  },
  {
    movieId: 2,
    hallId: 2,
    priceCents: 1800,
    times: ["11:00", "13:30", "16:00", "18:30", "21:00"]
  },
  {
    movieId: 3,
    hallId: 3,
    priceCents: 2000,
    times: ["13:00", "15:30", "18:00", "20:30", "23:00"]
  }
];

// Generate local date YYYY-MM-DD
function futureDate(daysAhead) {
  const date = new Date();

  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysAhead);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Check whether a hall already has a showtime
const checkExisting = db.prepare(`
  SELECT id
  FROM showtimes
  WHERE hall_id = ?
    AND date = ?
    AND time = ?
`);

// Insert a new showtime
const insertShowtime = db.prepare(`
  INSERT INTO showtimes
    (movie_id, hall_id, date, time, price_cents)
  VALUES (?, ?, ?, ?, ?)
`);


let inserted = 0;
let skipped = 0;
let transactionStarted = false;

try {
  // 1. Start SQLite transaction
  db.exec("BEGIN IMMEDIATE");
  transactionStarted = true;

  // 2. Generate showtimes for the next 7 days
  for (let day = 1; day <= 7; day++) {
    const date = futureDate(day);

    for (const schedule of schedules) {
      for (const time of schedule.times) {

        // Check if a showtime already exists
        const existing = checkExisting.get(
          schedule.hallId,
          date,
          time
        );

        if (existing) {
          skipped++;
          continue;
        }

        // Insert new showtime
        insertShowtime.run(
          schedule.movieId,
          schedule.hallId,
          date,
          time,
          schedule.priceCents
        );

        inserted++;
      }
    }
  }

  // 3. Save all changes
  db.exec("COMMIT");
  transactionStarted = false;

  console.log("=== SHOWTIME SEEDING COMPLETED ===");
  console.log("Inserted:", inserted);
  console.log("Skipped:", skipped);

  // 4. Check total number of showtimes
  const count = db.prepare(`
    SELECT COUNT(*) AS total
    FROM showtimes
  `).get();

  console.log("Total showtimes:", count.total);

} catch (error) {

  // Undo changes if transaction failed
  if (transactionStarted) {
    try {
      db.exec("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
    }
  }

  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
}