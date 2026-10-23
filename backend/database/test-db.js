const db = require("./db");

console.log("=== ALL MOVIES ===");

const movies = db.prepare(`
  SELECT * FROM movies
`).all();

console.table(movies);

console.log("=== MOVIE A SHOWTIMES ===");

const showtimes = db.prepare(`
  SELECT
    s.id,
    m.title,
    h.name AS hall,
    s.date,
    s.time,
    s.price_cents / 100.0 AS price_rm
  FROM showtimes s
  JOIN movies m ON s.movie_id = m.id
  JOIN halls h ON s.hall_id = h.id
  WHERE m.id = ?
  ORDER BY s.date, s.time
`).all(1);

console.table(showtimes);

console.log("=== FOREIGN KEY STATUS ===");

console.log(db.prepare("PRAGMA foreign_keys").get());

db.close();
