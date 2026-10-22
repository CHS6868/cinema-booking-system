// Establish "Express Application"
// Create an instance of Application
const express = require("express");
const app = express();

const PORT = 3000;

// Temporary movie data
const movies = [
  {
    id: 1,
    title: "Movie A",
    genre: "Action",
    duration: 120
  },
  {
    id: 2,
    title: "Movie B",
    genre: "Comedy",
    duration: 105
  },
  {
    id: 3,
    title: "Movie C",
    genre: "Horror",
    duration: 110
  }
];

// API 1: Get all movies
app.get("/api/movies", (req, res) => {
  res.status(200).json(movies);
});

// API 2: Get movie by ID
app.get("/api/movies/:id", (req, res) => {
  const movieId = Number(req.params.id);

  if (!Number.isInteger(movieId) || movieId < 1) {
    return res.status(400).json({
      message: "Invalid movie ID"
    });
  }

  const movie = movies.find(
    (m) => m.id === movieId
  );

  if (!movie) {
    return res.status(404).json({
      message: "Movie not found"
    });
  }

  res.status(200).json(movie);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
