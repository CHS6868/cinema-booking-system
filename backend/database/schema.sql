CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0)
);

CREATE TABLE IF NOT EXISTS halls (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS seats (
  id INTEGER PRIMARY KEY,
  hall_id INTEGER NOT NULL,
  seat_label TEXT NOT NULL,

  FOREIGN KEY (hall_id) REFERENCES halls(id),
  UNIQUE (hall_id, seat_label),
  UNIQUE (id, hall_id)
);

CREATE TABLE IF NOT EXISTS showtimes (
  id INTEGER PRIMARY KEY,
  movie_id INTEGER NOT NULL,
  hall_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),

  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (hall_id) REFERENCES halls(id),
  UNIQUE (id, hall_id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  showtime_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED'
    CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (showtime_id) REFERENCES showtimes(id),
  UNIQUE (id, showtime_id)
);

CREATE TABLE IF NOT EXISTS booking_seats (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  showtime_id INTEGER NOT NULL,
  hall_id INTEGER NOT NULL,
  seat_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED'
    CHECK (status IN ('CONFIRMED', 'CANCELLED')),

  FOREIGN KEY (booking_id, showtime_id)
    REFERENCES bookings(id, showtime_id),

  FOREIGN KEY (showtime_id, hall_id)
    REFERENCES showtimes(id, hall_id),

  FOREIGN KEY (seat_id, hall_id)
    REFERENCES seats(id, hall_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  unique_confirmed_showtime_seat
ON booking_seats(showtime_id, seat_id)
WHERE status = 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_showtimes_movie
ON showtimes(movie_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user
ON bookings(user_id);
