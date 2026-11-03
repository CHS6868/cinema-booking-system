// SQLite connection: production uses cinema.db, integration tests use an isolated database.
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

const productionDbPath = path.join(__dirname, "cinema.db");
const dbPath = process.env.CINEMA_DB_PATH || productionDbPath;

// Fail closed: tests must never silently fall back to the production database.
if (process.env.CINEMA_TEST_MODE === "1") {
  if (!process.env.CINEMA_DB_PATH ||
      path.resolve(dbPath) === path.resolve(productionDbPath)) {
    throw new Error("Unsafe test database configuration: refusing to open cinema.db");
  }
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
module.exports = db;
