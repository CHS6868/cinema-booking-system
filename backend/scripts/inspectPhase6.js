const db = require("../database/db");

console.log("=== TABLE DEFINITIONS ===");
for (const table of ["bookings", "booking_seats"]) {
  const result = db.prepare(`
    SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?
  `).get(table);
  console.log(`\n${table}:\n${result?.sql || "NOT FOUND"}`);
}

console.log("\n=== UNIQUE INDEXES ON BOOKING_SEATS ===");
const indexes = db.prepare("PRAGMA index_list('booking_seats')").all();
for (const index of indexes) {
  if (!index.unique) continue;
  const columns = db.prepare(`PRAGMA index_info("${index.name}")`).all();
  const definition = db.prepare(`SELECT sql FROM sqlite_master WHERE name = ?`).get(index.name);
  console.log({
    name: index.name,
    columns: columns.map(col => col.name),
    partial: Boolean(index.partial),
    sql: definition?.sql ?? "(defined by table constraint)"
  });
}
console.log("\n=== FOREIGN KEY CHECK ===");
console.table(db.prepare("PRAGMA foreign_key_check").all());
