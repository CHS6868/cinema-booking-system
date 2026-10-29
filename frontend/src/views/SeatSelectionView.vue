<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import SeatMap from "../components/SeatMap.vue";
import BookingSummary from "../components/BookingSummary.vue";
const route = useRoute();
const data = ref(null);
const selectedSeats = ref([]);
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref("");
const price = computed(() => Number(data.value?.showtime.price || 0));
async function loadSeats() {
  const response = await fetch(`/api/showtimes/${route.params.id}/seats`);
  if (!response.ok) throw new Error("Unable to load seat information");
  data.value = await response.json();
}
function toggleSeat(seat) {
  if (seat.status === "booked" || submitting.value) return;
  if (selectedSeats.value.includes(seat.id)) selectedSeats.value = selectedSeats.value.filter(id => id !== seat.id);
  else if (selectedSeats.value.length < 6) selectedSeats.value.push(seat.id);
}
async function confirmBooking() {
  if (!selectedSeats.value.length || submitting.value) return;
  submitting.value = true; error.value = ""; success.value = "";
  try {
    const response = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ showtimeId: Number(route.params.id), seatIds: selectedSeats.value })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Booking failed");
    success.value = `Demo booking #${result.id} confirmed! Total: RM ${Number(result.totalPrice).toFixed(2)}`;
    selectedSeats.value = [];
    await loadSeats();
  } catch (err) {
    error.value = err.message; selectedSeats.value = [];
    try { await loadSeats(); } catch { /* preserve primary error */ }
  } finally { submitting.value = false; }
}
onMounted(async () => {
  try { await loadSeats(); } catch (err) { error.value = err.message; }
  finally { loading.value = false; }
});
</script>
<template>
  <section class="page">
    <p v-if="loading" class="notice" role="status">Loading seats…</p>
    <template v-else-if="data">
      <RouterLink :to="{ name: 'movie-details', params: { id: data.showtime.movieId } }" class="back-link">← Back to showtimes</RouterLink>
      <p class="kicker">CHOOSE YOUR SEATS</p>
      <h1>{{ data.showtime.movieTitle }}</h1>
      <p class="lead">{{ data.showtime.date }} · {{ data.showtime.time }} · {{ data.showtime.hall }}</p>
      <p v-if="success" role="status" class="notice success">{{ success }} <RouterLink to="/my-bookings">View my bookings</RouterLink></p>
      <p v-if="error" role="alert" class="notice error">{{ error }}</p>
      <div class="booking-layout">
        <div class="card seat-panel"><SeatMap :seats="data.seats" :selected-seats="selectedSeats" :disabled="submitting" @toggle="toggleSeat" /></div>
        <BookingSummary :selected-seats="selectedSeats" :price="price" :submitting="submitting" @confirm="confirmBooking" />
      </div>
    </template>
    <p v-else-if="error" role="alert" class="notice error">{{ error }}</p>
  </section>
</template>
<style scoped>
.kicker { color: #7250b6; font-weight: 800; font-size: .75rem; letter-spacing: .15em; }
.booking-layout { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(260px, 1fr); gap: 1.5rem; align-items: start; margin-top: 1.75rem; }
.seat-panel { padding: 1.25rem; min-width: 0; }
@media (max-width: 850px) { .booking-layout { grid-template-columns: 1fr; } }
</style>
