// Establish SQLite database connection
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");

// cinema.db is the actual file that stores movie database
// Generate the correct path of the database file using path.join
const dbPath = path.join(__dirname, "cinema.db");

const db = new DatabaseSync(dbPath);

// Enforce relationships between tables
// Foreign Key Enforcement
db.exec("PRAGMA foreign_keys = ON;");

// Allow other JavaScript files to use this link for connection
module.exports = db;
