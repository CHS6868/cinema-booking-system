<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import ShowtimeCard from "../components/ShowtimeCard.vue";
const route = useRoute();
const movie = ref(null);
const showtimes = ref([]);
const selectedDate = ref("");
const loading = ref(true);
const error = ref("");
const availableDates = computed(() => [...new Set(showtimes.value.map(s => s.date))].sort());
const filteredShowtimes = computed(() => showtimes.value
  .filter(s => s.date === selectedDate.value)
  .sort((a, b) => a.time.localeCompare(b.time)));
async function loadMovieDetails() {
  loading.value = true; error.value = ""; movie.value = null; showtimes.value = [];
  try {
    const id = route.params.id;
    const [m, s] = await Promise.all([fetch(`/api/movies/${id}`), fetch(`/api/movies/${id}/showtimes`)]);
    if (!m.ok || !s.ok) throw new Error("Failed to load movie details");
    movie.value = await m.json();
    showtimes.value = await s.json();
    selectedDate.value = availableDates.value[0] || "";
  } catch (err) { error.value = err.message || "Unable to load movie details"; }
  finally { loading.value = false; }
}
watch(() => route.params.id, loadMovieDetails, { immediate: true });
</script>
<template>
  <section class="page">
    <RouterLink to="/" class="back-link">← Back to movies</RouterLink>
    <p v-if="loading" class="notice" role="status">Loading movie details…</p>
    <div v-else-if="error" class="notice error" role="alert">{{ error }} <button type="button" @click="loadMovieDetails">Try again</button></div>
    <template v-else-if="movie">
      <div class="movie-heading card">
        <div class="poster" aria-hidden="true">🎞️</div>
        <div class="movie-meta">
          <p class="eyebrow">NOW SHOWING</p>
          <h1>{{ movie.title }}</h1>
          <p class="muted">{{ movie.genre }} · {{ movie.duration }} minutes</p>
          <p>{{ showtimes.length }} available showtimes</p>
        </div>
      </div>
      <section class="section-space" aria-labelledby="date-title">
        <h2 id="date-title">1. Choose a date</h2>
        <p v-if="!availableDates.length" class="notice">No upcoming showtimes.</p>
        <div v-else class="date-row" role="group" aria-label="Select showtime date">
          <button v-for="date in availableDates" :key="date" type="button" class="date-button" :class="{ active: selectedDate === date }" :aria-pressed="selectedDate === date" @click="selectedDate = date">{{ date }}</button>
        </div>
      </section>
      <section v-if="selectedDate" aria-labelledby="showtimes-title">
        <h2 id="showtimes-title">2. Choose a showtime</h2>
        <div class="showtime-grid"><ShowtimeCard v-for="show in filteredShowtimes" :key="show.id" :show="show" /></div>
      </section>
    </template>
  </section>
</template>
<style scoped>
.movie-heading { display: flex; overflow: hidden; gap: 1.5rem; align-items: center; }
.poster { display: grid; place-items: center; flex: 0 0 210px; min-height: 220px; background: linear-gradient(145deg, #192b49, #504083); color: white; font-size: 4rem; }
.movie-meta { padding: 1.2rem; }
.movie-meta h1 { margin: .5rem 0; }
.eyebrow { color: #7250b6; font-weight: 800; font-size: .75rem; letter-spacing: .14em; }
.section-space { margin-top: 2.5rem; }
.date-row { display: flex; gap: .65rem; flex-wrap: wrap; }
.date-button { border: 1px solid #cbd2de; border-radius: 10px; background: white; padding: .8rem 1rem; }
.date-button.active { border-color: #5539a4; background: #5539a4; color: white; }
.showtime-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: .95rem; }
@media (max-width: 550px) { .movie-heading { flex-direction: column; align-items: stretch; gap: .4rem; } .poster { flex-basis: auto; min-height: 145px; } }
</style>
