
const db = require("../database/db");

console.log("=== USERS TABLE STRUCTURE ===");

// 1. Inspect users table columns
const usersColumns = db.prepare(`
  PRAGMA table_info(users)
`).all();

console.table(usersColumns);

// 2. Display users table SQL definition
console.log("\n=== USERS TABLE SQL ===");

const usersTable = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type = 'table'
    AND name = 'users'
`).get();

console.log(usersTable?.sql || "Users table not found");

// 3. Inspect users indexes
console.log("\n=== USERS TABLE INDEXES ===");

const userIndexes = db.prepare(`
  PRAGMA index_list('users')
`).all();

console.table(userIndexes);

// 4. Inspect booking foreign keys
console.log("\n=== BOOKINGS FOREIGN KEYS ===");

const bookingForeignKeys = db.prepare(`
  PRAGMA foreign_key_list('bookings')
`).all();

console.table(bookingForeignKeys);

// 5. Count users without exposing user data
console.log("\n=== TOTAL USERS ===");

const result = db.prepare(`
  SELECT COUNT(*) AS total
  FROM users
`).get();

console.log("Total users:", result.total);

// 6. Check whether foreign keys are enabled
console.log("\n=== FOREIGN KEY ENFORCEMENT ===");

const foreignKeysEnabled = db.prepare(`
  PRAGMA foreign_keys
`).get();

console.log(foreignKeysEnabled);

console.log("\nAuthentication schema inspection completed.");
