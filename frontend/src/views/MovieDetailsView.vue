
<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const movie = ref(null);
const showtimes = ref([]);
const selectedDate = ref("");
const loading = ref(true);
const error = ref("");

// Get the available dates from showtimes
const availableDates = computed(() => {
  return [...new Set(showtimes.value.map(s => s.date))].sort();
});

// Filter showtimes based on the selected date
const filteredShowtimes = computed(() => {
  return showtimes.value
    .filter(s => s.date === selectedDate.value)
    .sort((a, b) => a.time.localeCompare(b.time));
});

async function loadMovieDetails() {
  try {
    const movieId = route.params.id;

    const [movieResponse, showtimeResponse] = await Promise.all([
      fetch(`/api/movies/${movieId}`),
      fetch(`/api/movies/${movieId}/showtimes`)
    ]);

    if (!movieResponse.ok || !showtimeResponse.ok) {
      throw new Error("Failed to load movie details");
    }

    movie.value = await movieResponse.json();
    showtimes.value = await showtimeResponse.json();

    selectedDate.value = availableDates.value[0] || "";
  } catch (err) {
    error.value = "Unable to load movie details.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadMovieDetails);
</script>

<template>
  <section class="page">
    <RouterLink to="/" class="back">← Back to Movies</RouterLink>

    <p v-if="loading">Loading movie details...</p>
    <p v-else-if="error">{{ error }}</p>

    <div v-else-if="movie">
      <div class="movie-info">
        <div class="poster">🎬</div>

        <div>
          <h1>{{ movie.title }}</h1>
          <p>Genre: {{ movie.genre }}</p>
          <p>Duration: {{ movie.duration }} minutes</p>
          <p>Total showtimes: {{ showtimes.length }}</p>
        </div>
      </div>

      <h2>Select Date</h2>

      <p v-if="availableDates.length === 0">
        No showtimes available.
      </p>

      <div class="dates">
        <button
          v-for="date in availableDates"
          :key="date"
          :class="{ active: selectedDate === date }"
          @click="selectedDate = date"
        >
          {{ date }}
        </button>
      </div>

      <h2 v-if="selectedDate">Available Showtimes</h2>

      <div class="showtimes">
        <RouterLink
          v-for="show in filteredShowtimes"
          :key="show.id"
          :to="{ name: 'seats', params: { id: show.id } }"
          class="showtime-card"
        >
          <strong>{{ show.time }}</strong>
          <span>{{ show.hall }}</span>
          <span>RM {{ show.price.toFixed(2) }}</span>
          <span class="select">Select Seats →</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 40px auto;
  padding: 20px;
}

.back {
  color: #2563eb;
  text-decoration: none;
}

.movie-info {
  display: flex;
  gap: 30px;
  margin: 30px 0;
}

.poster {
  width: 180px;
  min-height: 240px;
  display: grid;
  place-items: center;
  background: #e2e8f0;
  border-radius: 12px;
  font-size: 60px;
}

.dates, .showtimes {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 20px 0 35px;
}

.dates button {
  padding: 12px 20px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 8px;
  cursor: pointer;
}

.dates button.active {
  color: white;
  background: #1e293b;
}

.showtime-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
  padding: 20px;
  background: white;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  text-decoration: none;
}

.showtime-card:hover {
  border-color: #2563eb;
}

.select {
  color: #2563eb;
  font-size: 14px;
}
</style>
