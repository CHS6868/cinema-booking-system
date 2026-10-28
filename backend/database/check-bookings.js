
const db = require("./db");

console.log("=== BOOKING RECORDS ===");

const bookings = db.prepare(`
  SELECT
    b.id AS bookingId,
    m.title AS movie,
    s.date,
    s.time,
    b.status,
    COUNT(bs.id) AS ticketCount
  FROM bookings b
  JOIN showtimes s
    ON b.showtime_id = s.id
  JOIN movies m
    ON s.movie_id = m.id
  LEFT JOIN booking_seats bs
    ON bs.booking_id = b.id
  GROUP BY b.id
  ORDER BY b.id
`).all();

console.table(bookings);

console.log("=== BOOKED SEATS ===");

const seats = db.prepare(`
  SELECT
    bs.booking_id AS bookingId,
    bs.showtime_id AS showtimeId,
    s.seat_label AS seat,
    bs.status
  FROM booking_seats bs
  JOIN seats s
    ON bs.seat_id = s.id
  ORDER BY bs.booking_id, s.seat_label
`).all();

console.table(seats);

console.log("=== FOREIGN KEY CHECK ===");

console.log(
  db.prepare("PRAGMA foreign_key_check").all()
);

db.close();
