<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";

// Reactive variables
const movies = ref([]);
const loading = ref(true);
const error = ref("");

// Fetch movies from Express Backend
async function loadMovies() {
  try {
    const response = await fetch("/api/movies");

    if (!response.ok) {
      throw new Error("Failed to load movies");
    }

    movies.value = await response.json();

    console.log("Movies loaded:", movies.value);
  } catch (err) {
    error.value = "Unable to load movies.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadMovies);
</script>

<template>
  <section class="page">
    <h2>Now Showing</h2>
    <p>Choose a movie to explore available showtimes.</p>

    <!-- Loading status -->
    <p v-if="loading">Loading movies...</p>

    <!-- Error status -->
    <p v-if="error">{{ error }}</p>

    <!-- Empty list -->
    <p v-if="!loading && !error && movies.length === 0">
      No movies available.
    </p>

    <!-- Movie cards -->
    <div v-if="movies.length > 0" class="movie-grid">
      <article
        v-for="movie in movies"
        :key="movie.id"
        class="movie-card"
      >
        <div class="poster">🎬</div>

        <h3>{{ movie.title }}</h3>

        <p>Genre: {{ movie.genre }}</p>

        <p>Duration: {{ movie.duration }} minutes</p>

        <p>{{ movie.showtimeCount }} showtimes available</p>
          <RouterLink
            :to="{
              name: 'movie-details',
              params: { id: movie.id }
            }"
            class="view-button"
          >
            View Details
          </RouterLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 40px auto;
  padding: 20px;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-top: 30px;
}

.movie-card {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
}

.poster {
  background-color: #e2e8f0;
  padding: 50px;
  text-align: center;
  font-size: 40px;
  border-radius: 8px;
}

.view-button {
  display: block;
  margin-top: 16px;
  padding: 12px;
  background-color: #1e293b;
  color: white;
  text-align: center;
  border-radius: 6px;
  text-decoration: none;
}

.view-button:hover {
  background-color: #334155;
}
</style>

