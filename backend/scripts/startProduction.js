const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const backendDir = path.resolve(__dirname, "..");

const dbPath =
  process.env.CINEMA_DB_PATH ||
  path.join(backendDir, "database", "cinema.db");

// Ensure the database directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

function runScript(relativePath) {
  const scriptPath = path.join(backendDir, relativePath);

  console.log(`Running: ${relativePath}`);

  execFileSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: process.env
  });
}

// Determine whether initial schema creation is required
const db = new DatabaseSync(dbPath);

const schemaExists = Boolean(
  db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'movies'
  `).get()
);

db.close();

if (!schemaExists) {
  console.log("Initializing fresh demo database...");
  runScript("database/init.js");
}

// These scripts must be safe to run repeatedly
runScript("scripts/createAuthSessions.js");
runScript("scripts/ensureUsersEmailIndex.js");
runScript("scripts/seedShowtimes.js");

// Import the Express application without launching its
// development listener
const app = require("../server");

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cinema Booking System listening on ${PORT}`);
});
