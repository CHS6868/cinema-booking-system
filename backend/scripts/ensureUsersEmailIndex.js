
const db = require("../database/db");

try {
  const columns = db.prepare(
    "PRAGMA table_info(users)"
  ).all();

  const columnNames = new Set(
    columns.map(column => column.name)
  );

  if (!columnNames.has("email")) {
    throw new Error(
      "The users table needs an email column."
    );
  }

  // Find duplicates before creating the index
  const duplicates = db.prepare(`
    SELECT LOWER(email) AS normalized_email,
           COUNT(*) AS total
    FROM users
    WHERE email IS NOT NULL
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  `).all();

  if (duplicates.length > 0) {
    throw new Error(
      "Duplicate emails exist. Review them before adding the index."
    );
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      uq_users_email_lower
    ON users(LOWER(email))
  `);

  console.log("Users email unique index is ready.");

} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
