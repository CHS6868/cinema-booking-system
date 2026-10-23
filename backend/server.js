// Establish "Express Application"
// Create an instance of Application

const express = require("express");
const db = require("./database/db");

const app = express();
const PORT = 3000;

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
const showtimes = [
  { id: 101, movieId: 1, date: futureDate(1), time: "14:00", hall: "Hall 1", price: 18 },
  { id: 102, movieId: 1, date: futureDate(1), time: "19:00", hall: "Hall 1", price: 18 },
  { id: 103, movieId: 1, date: futureDate(2), time: "20:00", hall: "Hall 2", price: 20 },

  { id: 201, movieId: 2, date: futureDate(1), time: "12:00", hall: "Hall 2", price: 18 },
  { id: 202, movieId: 2, date: futureDate(2), time: "17:00", hall: "Hall 1", price: 18 },

  { id: 301, movieId: 3, date: futureDate(1), time: "21:00", hall: "Hall 3", price: 20 },
  { id: 302, movieId: 3, date: futureDate(2), time: "21:00", hall: "Hall 3", price: 20 }
];

// 3. Cinema seats: A1-A6, B1-B6, C1-C6, D1-D6
const seatIds = ["A", "B", "C", "D"].flatMap(
  row => Array.from({ length: 6 }, (_, i) => `${row}${i + 1}`)
);

// Store booked seats temporarily in memory
const bookedSeats = new Map([
  [101, new Set(["A2", "B4"])],
  [102, new Set(["B1"])],
  [201, new Set(["C3"])]
]);

let nextBookingId = 1;

// GET all movies, including showtime counts
app.get("/api/movies", (req, res) => {
  try {
    const movies = db.prepare(`
      SELECT
        m.id,
        m.title,
        m.genre,
        m.duration,
        COUNT(s.id) AS showtimeCount
      FROM movies m
      LEFT JOIN showtimes s
        ON m.id = s.movie_id
      GROUP BY m.id
      ORDER BY m.id
    `).all();

    res.status(200).json(movies);

  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Unable to fetch movies"
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
      SELECT id FROM movies WHERE id = ?
    `).get(movieId);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    const showtimes = db.prepare(`
      SELECT
        s.id,
        s.movie_id AS movieId,
        s.date,
        s.time,
        h.name AS hall,
        s.price_cents / 100.0 AS price
      FROM showtimes s
      JOIN halls h
        ON s.hall_id = h.id
      WHERE s.movie_id = ?
      ORDER BY s.date, s.time
    `).all(movieId);

    res.status(200).json(showtimes);

  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Unable to fetch showtimes"
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
  const showtime = showtimes.find(
    s => s.id === Number(req.params.id)
  );

  if (!showtime) {
    return res.status(404).json({ message: "Showtime not found" });
  }

  const movie = movies.find(m => m.id === showtime.movieId);
  const reserved = bookedSeats.get(showtime.id) || new Set();

  res.json({
    showtime: { ...showtime, movieTitle: movie.title },
    seats: seatIds.map(id => ({
      id,
      status: reserved.has(id) ? "booked" : "available"
    }))
  });
});

// POST a demo booking
app.post("/api/bookings", (req, res) => {
  const { showtimeId, seatIds: selectedSeats } = req.body || {};

  const showtime = showtimes.find(s => s.id === showtimeId);

  if (!showtime) {
    return res.status(404).json({ message: "Showtime not found" });
  }

  if (
    !Array.isArray(selectedSeats) ||
    selectedSeats.length === 0 ||
    selectedSeats.length > 6 ||
    new Set(selectedSeats).size !== selectedSeats.length ||
    !selectedSeats.every(id => seatIds.includes(id))
  ) {
    return res.status(400).json({ message: "Invalid seat selection" });
  }

  const reserved = bookedSeats.get(showtimeId) || new Set();

  if (selectedSeats.some(id => reserved.has(id))) {
    return res.status(409).json({
      message: "One or more selected seats are already booked"
    });
  }

  selectedSeats.forEach(id => reserved.add(id));
  bookedSeats.set(showtimeId, reserved);

  res.status(201).json({
    id: nextBookingId++,
    showtimeId,
    seatIds: selectedSeats,
    totalPrice: selectedSeats.length * showtime.price,
    status: "CONFIRMED"
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
