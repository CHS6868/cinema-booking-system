<script setup>
import { onMounted, ref } from "vue";
import MovieCard from "../components/MovieCard.vue";
const movies = ref([]);
const loading = ref(true);
const error = ref("");
async function loadMovies() {
  loading.value = true; error.value = "";
  try {
    const response = await fetch("/api/movies");
    if (!response.ok) throw new Error("Failed to load movies");
    movies.value = await response.json();
  } catch (err) { error.value = err.message || "Unable to load movies."; }
  finally { loading.value = false; }
}
onMounted(loadMovies);
</script>
<template>
  <section class="page">
    <p class="kicker">DISCOVER · BOOK · ENJOY</p>
    <h1>Now showing</h1>
    <p class="lead">Choose a movie, pick a showtime, and reserve your seats in a few steps.</p>
    <p v-if="loading" class="notice" role="status">Loading movies…</p>
    <div v-else-if="error" class="notice error" role="alert">{{ error }} <button type="button" @click="loadMovies">Try again</button></div>
    <p v-else-if="movies.length === 0" class="notice">No movies available right now.</p>
    <div v-else class="movie-grid"><MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" /></div>
  </section>
</template>
<style scoped>
.kicker { margin: 0; color: #7250b6; font-weight: 800; font-size: .75rem; letter-spacing: .15em; }
.movie-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 1.4rem; margin-top: 2rem; }
</style>
