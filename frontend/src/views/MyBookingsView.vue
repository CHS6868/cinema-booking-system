<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
const bookings = ref([]);
const loading = ref(true);
const cancellingId = ref(null);
const error = ref("");
const message = ref("");

// Phase 7 refinement: filter reservations locally without new API calls.
const activeFilter = ref("upcoming");
const now = ref(Date.now());
const filterOptions = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" }
];

function getShowtimeMs(booking) {
  const date = String(booking.date ?? "");
  const time = String(booking.time ?? "").slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return Number.NaN;
  }
  return Date.parse(`${date}T${time}:00+08:00`);
}

function bookingCategory(booking) {
  if (booking.status === "CANCELLED") return "cancelled";
  const start = getShowtimeMs(booking);
  return booking.status === "CONFIRMED" && Number.isFinite(start) && start > now.value
    ? "upcoming"
    : "past";
}

const filteredBookings = computed(() =>
  bookings.value.filter(booking => bookingCategory(booking) === activeFilter.value)
);
const filterCounts = computed(() => Object.fromEntries(
  filterOptions.map(option => [
    option.id,
    bookings.value.filter(booking => bookingCategory(booking) === option.id).length
  ])
));

function setFilter(id) {
  now.value = Date.now();
  activeFilter.value = id;
}

const emptyMessages = {
  upcoming: "You have no upcoming bookings.",
  past: "You have no past bookings.",
  cancelled: "You have no cancelled bookings."
};
let clockInterval;
async function loadBookings() {
  loading.value = true; error.value = "";
  try {
    const response = await fetch("/api/my-bookings", { credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
    bookings.value = result.bookings || [];
  } catch (err) { bookings.value = []; error.value = err.message; }
  finally { loading.value = false; }
}
function canCancel(booking) {
  const start = getShowtimeMs(booking);
  return booking.status === "CONFIRMED" && Number.isFinite(start) && start > Date.now();
}
async function cancelBooking(booking) {
  if (!canCancel(booking) || cancellingId.value !== null) return;
  if (!window.confirm(`Cancel booking #${booking.bookingId}? This will release your seats.`)) return;
  cancellingId.value = booking.bookingId; error.value = ""; message.value = "";
  try {
    const response = await fetch(`/api/bookings/${booking.bookingId}/cancel`, { method: "PATCH", credentials: "same-origin" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
    message.value = result.message || "Booking cancelled";
    await loadBookings();
    setFilter("cancelled"); // Show the cancelled reservation immediately.
  } catch (err) { error.value = err.message; }
  finally { cancellingId.value = null; }
}
onMounted(() => {
  loadBookings();
  clockInterval = setInterval(() => { now.value = Date.now(); }, 60_000);
});
onUnmounted(() => clearInterval(clockInterval));
</script>
<template>
  <section class="page bookings-page">
    <h1>My bookings</h1>
    <p class="lead">Review your confirmed and cancelled reservations.</p>
    <div class="booking-filters" role="group" aria-label="Filter bookings">
      <button
        v-for="option in filterOptions"
        :key="option.id"
        type="button"
        class="filter-button"
        :class="{ active: activeFilter === option.id }"
        :aria-pressed="activeFilter === option.id"
        @click="setFilter(option.id)"
      >
        {{ option.label }}
        <span class="filter-count">{{ filterCounts[option.id] }}</span>
      </button>
    </div>
    <p v-if="message" class="notice success" role="status">{{ message }}</p>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="loading" class="notice" role="status">Loading bookings…</p>
    <div v-else-if="!error && bookings.length === 0" class="card empty-state"><h2>No bookings yet</h2><p class="muted">Explore movies and reserve a seat to get started.</p><RouterLink class="btn btn-primary" to="/">Browse movies</RouterLink></div>
    <div v-else-if="!error" class="booking-list">
      <div v-if="filteredBookings.length === 0" class="card empty-state">
        <h2>{{ emptyMessages[activeFilter] }}</h2>
        <p class="muted">Use the filters to view your other reservations.</p>
      </div>
      <article v-for="booking in filteredBookings" :key="booking.bookingId" class="card booking-card">
        <div class="card-top"><div><p class="booking-id">BOOKING #{{ booking.bookingId }}</p><h2>{{ booking.movieTitle }}</h2></div><span class="status" :class="booking.status === 'CONFIRMED' ? 'confirmed' : 'cancelled'">{{ booking.status }}</span></div>
        <div class="details-grid"><p><span>Date</span><strong>{{ booking.date }}</strong></p><p><span>Time</span><strong>{{ booking.time }}</strong></p><p><span>Hall</span><strong>{{ booking.hall }}</strong></p><p><span>Seats</span><strong>{{ booking.seats || 'None' }}</strong></p></div>
        <div class="card-bottom"><p>Total <strong>RM {{ Number(booking.totalPrice).toFixed(2) }}</strong></p><button v-if="canCancel(booking)" type="button" class="cancel-button" :disabled="cancellingId !== null" @click="cancelBooking(booking)">{{ cancellingId === booking.bookingId ? 'Cancelling…' : 'Cancel booking' }}</button></div>
      </article>
    </div>
  </section>
</template>
<style scoped>
.booking-filters { display: flex; flex-wrap: wrap; gap: .65rem; margin: 1.2rem 0 1.4rem; }
.filter-button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .65rem .95rem; border-radius: 999px; border: 1px solid #d9deea; background: #fff; color: #46536a; font-weight: 700; }
.filter-button:hover { border-color: #8f79c6; }
.filter-button.active { background: #5539a4; border-color: #5539a4; color: #fff; }
.filter-count { display: inline-flex; align-items: center; justify-content: center; min-width: 1.45rem; padding: .15rem .4rem; border-radius: 999px; background: #eef0f7; color: #45536c; font-size: .75rem; }
.filter-button.active .filter-count { background: rgba(255,255,255,.22); color: #fff; }
.bookings-page { max-width: 860px; }
.booking-list { display: grid; gap: 1.2rem; }
.booking-card { padding: 1.4rem; }
.card-top, .card-bottom { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.card-top h2 { margin: .2rem 0 1rem; font-size: 1.3rem; }
.booking-id { font-size: .75rem; font-weight: 800; letter-spacing: .09em; color: #7250b6; margin: 0; }
.status { border-radius: 999px; padding: .4rem .7rem; font-size: .72rem; font-weight: 800; }
.status.confirmed { background: #def5e7; color: #176a43; }
.status.cancelled { background: #eef0f4; color: #626d7a; }
.details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem 1.5rem; }
.details-grid p { display: grid; gap: .3rem; margin: .4rem 0; }
.details-grid span { color: #64718a; font-size: .85rem; }
.card-bottom { border-top: 1px solid #e0e5ee; margin-top: 1rem; padding-top: .75rem; }
.card-bottom strong { margin-left: .5rem; font-size: 1.15rem; }
.cancel-button { border: 1px solid #e0abb2; border-radius: 9px; background: #fff1f2; color: #a32839; padding: .7rem 1rem; font-weight: 700; }
.cancel-button:disabled { opacity: .55; cursor: not-allowed; }
.empty-state { text-align: center; padding: 2rem; }
@media (max-width: 550px) { .card-top, .card-bottom { align-items: flex-start; flex-wrap: wrap; } .booking-card { padding: 1rem; } }
</style>
