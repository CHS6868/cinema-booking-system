
const db = require("../database/db");

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
    ON auth_sessions(user_id)
  `);

  const columns = db.prepare(
    "PRAGMA table_info(auth_sessions)"
  ).all();

  console.table(columns);
  console.log("Authentication sessions table is ready.");

} catch (error) {
  console.error("Session migration error:", error);
  process.exitCode = 1;
}
