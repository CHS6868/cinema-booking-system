
const db = require("../database/db");

console.log("=== DATABASE LOCATION ===");

const locations = db.prepare("PRAGMA database_list").all();
console.table(locations);

console.log("\n=== DATABASE TABLES ===");

const tables = db.prepare(`
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
  ORDER BY name
`).all();

console.table(tables);

// Tables expected in our Cinema Booking System
const requiredTables = [
  "movies",
  "halls",
  "seats",
  "showtimes",
  "bookings",
  "booking_seats"
];

const existingTables = new Set(
  tables.map(table => table.name)
);

for (const table of requiredTables) {
  console.log(`\n=== ${table.toUpperCase()} ===`);

  if (!existingTables.has(table)) {
    console.log("TABLE NOT FOUND");
    continue;
  }

  // Display column structure
  const columns = db.prepare(
    `PRAGMA table_info("${table}")`
  ).all();

  console.table(
    columns.map(column => ({
      name: column.name,
      type: column.type,
      primaryKey: column.pk
    }))
  );

  // Count records
  const count = db.prepare(
    `SELECT COUNT(*) AS total FROM "${table}"`
  ).get();

  console.log("Total records:", count.total);
}

// Display some showtime records
if (existingTables.has("showtimes")) {
  console.log("\n=== SAMPLE SHOWTIMES ===");

  const showtimes = db.prepare(`
    SELECT *
    FROM showtimes
    LIMIT 10
  `).all();

  console.table(showtimes);
}

// Check foreign key integrity
console.log("\n=== FOREIGN KEY CHECK ===");

const foreignKeyErrors = db.prepare(
  "PRAGMA foreign_key_check"
).all();

console.table(foreignKeyErrors);

console.log("\nDatabase inspection completed.");