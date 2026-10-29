
const db = require("../database/db");

console.log("=== BOOKINGS TABLE STRUCTURE ===");

console.table(
  db.prepare("PRAGMA table_info(bookings)").all()
);

console.log("\n=== BOOKING_SEATS TABLE STRUCTURE ===");

console.table(
  db.prepare("PRAGMA table_info(booking_seats)").all()
);

console.log("\n=== TABLE DEFINITIONS ===");

const tables = db.prepare(`
  SELECT name, sql
  FROM sqlite_master
  WHERE type = 'table'
    AND name IN ('bookings', 'booking_seats')
`).all();

for (const table of tables) {
  console.log(`\n${table.name}:`);
  console.log(table.sql);
}

console.log("\n=== BOOKING SEAT INDEXES ===");

const indexes = db.prepare(`
  SELECT name, sql
  FROM sqlite_master
  WHERE type = 'index'
    AND tbl_name = 'booking_seats'
`).all();

console.table(indexes);

console.log("\n=== BOOKING STATUS COUNTS ===");

console.table(
  db.prepare(`
    SELECT status, COUNT(*) AS total
    FROM bookings
    GROUP BY status
  `).all()
);

console.log("\n=== BOOKING SEAT STATUS COUNTS ===");

console.table(
  db.prepare(`
    SELECT status, COUNT(*) AS total
    FROM booking_seats
    GROUP BY status
  `).all()
);

console.log("\n=== FOREIGN KEY CHECK ===");

console.table(
  db.prepare("PRAGMA foreign_key_check").all()
);

console.log("\nSchema inspection completed.");