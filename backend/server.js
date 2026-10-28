// Establish "Express Application"
// Create an instance of Application

const express = require("express");
const db = require("./database/db");

const app = express();
const PORT = 3000;


function getLocalNow() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

app.use(express.json());

// 1. Movie data
const movies = [
  { id: 1, title: "Movie A", genre: "Action", duration: 120 },
  { id: 2, title: "Movie B", genre: "Comedy", duration: 105 },
  { id: 3, title: "Movie C", genre: "Horror", duration: 110 }
];

// Generate future dates using local time
function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 2. Movie showtimes

const movieSchedules = [
  {
    movieId: 1,
    hall: "Hall 1",
    price: 18,
    times: ["10:00", "13:00", "16:00", "19:00", "22:00"]
  },
  {
    movieId: 2,
    hall: "Hall 2",
    price: 18,
    times: ["11:00", "13:30", "16:00", "18:30", "21:00"]
  },
  {
    movieId: 3,
    hall: "Hall 3",
    price: 20,
    times: ["13:00", "15:30", "18:00", "20:30", "23:00"]
  }
];

// Generate showtimes for 7 days, including today
function generateShowtimes() {
  const result = [];

  for (let day = 0; day < 7; day++) {
    const date = futureDate(day);

    for (const schedule of movieSchedules) {
      schedule.times.forEach((time, index) => {
        result.push({
          id: schedule.movieId * 1000 + day * 10 + index + 1,
          movieId: schedule.movieId,
          date,
          time,
          hall: schedule.hall,
          price: schedule.price
        });
      });
    }
  }

  return result;
}

const showtimes = generateShowtimes();

function getShowtimeDateTime(showtime) {
  const [year, month, day] = showtime.date
    .split("-")
    .map(Number);

  const [hour, minute] = showtime.time
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute
  );
}

function isUpcomingShowtime(showtime) {
  const showtimeDateTime = getShowtimeDateTime(showtime);

  return showtimeDateTime.getTime() > Date.now();
}


// 3. Cinema seats: A1-A6, B1-B6, C1-C6, D1-D6
const seatIds = ["A", "B", "C", "D"].flatMap(
  row => Array.from({ length: 6 }, (_, i) => `${row}${i + 1}`)
);

// Store booked seats temporarily in memory
const bookedSeats = new Map([
  [1001, new Set(["A2", "B4"])],
  [1002, new Set(["B1"])],
  [2001, new Set(["C3"])]
]);

let nextBookingId = 1;

// GET all movies, including showtime counts

app.get("/api/movies", (req, res) => {
  try {
    const { date, time } = getLocalNow();

    const movies = db.prepare(`
      SELECT
        m.id,
        m.title,
        m.genre,
        m.duration,
        COUNT(s.id) AS showtimeCount
      FROM movies AS m
      LEFT JOIN showtimes AS s
        ON s.movie_id = m.id
        AND (
          s.date > ?
          OR (s.date = ? AND s.time > ?)
        )
      GROUP BY
        m.id, m.title, m.genre, m.duration
      ORDER BY m.id
    `).all(date, date, time);

    res.status(200).json(movies);

  } catch (error) {
    console.error("Movie API error:", error);

    res.status(500).json({
      message: "Unable to load movies"
    });
  }
});

// GET movie details

app.get("/api/movies/:id/showtimes", (req, res) => {
  try {
    const movieId = Number(req.params.id);

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const movie = db.prepare(`
      SELECT id
      FROM movies
      WHERE id = ?
    `).get(movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    const { date, time } = getLocalNow();

    const showtimes = db.prepare(`
      SELECT
        s.id,
        s.movie_id AS movieId,
        s.date,
        s.time,
        h.name AS hall,
        s.price_cents / 100.0 AS price
      FROM showtimes AS s
      JOIN halls AS h
        ON s.hall_id = h.id
      WHERE s.movie_id = ?
        AND (
          s.date > ?
          OR (s.date = ? AND s.time > ?)
        )
      ORDER BY s.date, s.time, s.id
    `).all(movieId, date, date, time);

    res.status(200).json(showtimes);

  } catch (error) {
    console.error("Showtime API error:", error);

    res.status(500).json({
      message: "Unable to load showtimes"
    });
  }
});

// GET showtimes for a specific movie
app.get("/api/movies/:id", (req, res) => {
  try {
    const movieId = Number(req.params.id);

    if (!Number.isSafeInteger(movieId) || movieId < 1) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const movie = db.prepare(`
      SELECT id, title, genre, duration
      FROM movies
      WHERE id = ?
    `).get(movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.status(200).json(movie);

  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Unable to fetch movie details"
    });
  }
});


// GET seat availability for a showtime

app.get("/api/showtimes/:id/seats", (req, res) => {
  try {
    const showtimeId = Number(req.params.id);

    // 1. Validate Showtime ID
    if (!Number.isSafeInteger(showtimeId) || showtimeId < 1) {
      return res.status(400).json({
        message: "Invalid showtime ID"
      });
    }

    // 2. Find showtime from SQLite
      console.log("SQLite Seat API reached!");
      console.log("Requested ID:", req.params.id);

    const showtime = db.prepare(`
      SELECT
        s.id,
        s.movie_id AS movieId,
        s.hall_id AS hallId,
        s.date,
        s.time,
        s.price_cents / 100.0 AS price,
        h.name AS hall,
        m.title AS movieTitle
      FROM showtimes AS s
      JOIN halls AS h ON s.hall_id = h.id
      JOIN movies AS m ON s.movie_id = m.id
      WHERE s.id = ?
    `).get(showtimeId);

    if (!showtime) {
      return res.status(404).json({
        message: "Showtime not found"
      });
    }

    console.log("Requested Showtime ID:", showtimeId);
    console.log("SQLite Showtime Result:", showtime);

    // 3. Reject expired showtimes
    const { date, time } = getLocalNow();

    if (
      showtime.date < date ||
      (showtime.date === date && showtime.time <= time)
    ) {
      return res.status(400).json({
        message: "This showtime has already started"
      });
    }

    // 4. Get seats and confirmed booking status
    const seats = db.prepare(`
      SELECT
        se.seat_label AS id,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM booking_seats AS bs
            WHERE bs.showtime_id = ?
              AND bs.seat_id = se.id
              AND bs.status = 'CONFIRMED'
          )
          THEN 'booked'
          ELSE 'available'
        END AS status
      FROM seats AS se
      WHERE se.hall_id = ?
      ORDER BY se.seat_label
    `).all(showtimeId, showtime.hallId);

    // 5. Return data to Vue
    res.status(200).json({
      showtime,
      seats
    });

  } catch (error) {
    console.error("Seat API error:", error);

    res.status(500).json({
      message: "Unable to load seats"
    });
  }
});

// POST a demo booking
app.post("/api/bookings", (req, res) => {
  const { showtimeId, seatIds } = req.body || {};

  // 1. Validate request data
  if (
    !Number.isSafeInteger(showtimeId) ||
    showtimeId < 1 ||
    !Array.isArray(seatIds) ||
    seatIds.length === 0 ||
    seatIds.length > 6 ||
    !seatIds.every(id => typeof id === "string") ||
    new Set(seatIds).size !== seatIds.length
  ) {
    return res.status(400).json({
      message: "Invalid booking request"
    });
  }

  let transactionStarted = false;

  // Helper for errors with HTTP status codes
  function bookingError(status, message) {
    const error = new Error(message);
    error.httpStatus = status;
    return error;
  }

  try {
    // 2. Start an immediate transaction
    db.exec("BEGIN IMMEDIATE");
    transactionStarted = true;

    // 3. Get showtime information
    const showtime = db.prepare(`
      SELECT
        id,
        hall_id AS hallId,
        date,
        time,
        price_cents AS priceCents
      FROM showtimes
      WHERE id = ?
    `).get(showtimeId);

    if (!showtime) {
      throw bookingError(404, "Showtime not found");
    }

    // 4. Ensure showtime has not started
    // Local development uses the computer's local time.
    const startTime = new Date(
      `${showtime.date}T${showtime.time}:00`
    );

    if (
      Number.isNaN(startTime.getTime()) ||
      startTime <= new Date()
    ) {
      throw bookingError(
        400,
        "Booking is closed for this showtime"
      );
    }

    // 5. Get valid seats for this hall
    const hallSeats = db.prepare(`
      SELECT id, seat_label
      FROM seats
      WHERE hall_id = ?
    `).all(showtime.hallId);

    const seatMap = new Map(
      hallSeats.map(seat => [seat.seat_label, seat.id])
    );

    // Check that all selected seats exist in the hall
    if (seatIds.some(label => !seatMap.has(label))) {
      throw bookingError(
        400,
        "Invalid seats for this hall"
      );
    }

    const selectedSeatIds = seatIds.map(
      label => seatMap.get(label)
    );

    // 6. Check confirmed reservations
    const reserved = db.prepare(`
      SELECT seat_id
      FROM booking_seats
      WHERE showtime_id = ?
        AND status = 'CONFIRMED'
    `).all(showtimeId);

    const reservedIds = new Set(
      reserved.map(row => row.seat_id)
    );

    if (selectedSeatIds.some(id => reservedIds.has(id))) {
      throw bookingError(
        409,
        "One or more seats are already booked"
      );
    }

    // 7. Create booking record
    // user_id is NULL until Phase 5 authentication
    const bookingResult = db.prepare(`
      INSERT INTO bookings
      (user_id, showtime_id, status)
      VALUES (NULL, ?, 'CONFIRMED')
    `).run(showtimeId);

    const bookingId = Number(bookingResult.lastInsertRowid);

    // 8. Save all selected seats
    const insertSeat = db.prepare(`
      INSERT INTO booking_seats
      (booking_id, showtime_id, hall_id, seat_id, status)
      VALUES (?, ?, ?, ?, 'CONFIRMED')
    `);

    for (const seatId of selectedSeatIds) {
      insertSeat.run(
        bookingId,
        showtimeId,
        showtime.hallId,
        seatId
      );
    }

    // 9. Save all database changes
    db.exec("COMMIT");
    transactionStarted = false;

    // 10. Return successful booking
    res.status(201).json({
      id: bookingId,
      showtimeId,
      seatIds,
      totalPrice: (
        seatIds.length * showtime.priceCents
      ) / 100,
      status: "CONFIRMED"
    });

  } catch (error) {
    // Undo incomplete database changes
    if (transactionStarted) {
      try {
        db.exec("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    // Expected business-rule errors
    if (error.httpStatus) {
      return res.status(error.httpStatus).json({
        message: error.message
      });
    }

    // Handle database uniqueness conflicts
    if (
      /UNIQUE constraint failed: booking_seats\.showtime_id, booking_seats\.seat_id/.test(
        error.message
      )
    ) {
      return res.status(409).json({
        message: "One or more seats are already booked"
      });
    }

    console.error("Booking database error:", error);

    res.status(500).json({
      message: "Unable to complete booking"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
