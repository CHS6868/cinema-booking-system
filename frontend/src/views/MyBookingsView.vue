<script setup>
import { onMounted, ref } from "vue";

const bookings = ref([]);
const loading = ref(true);
const cancellingId = ref(null);
const error = ref("");
const message = ref("");

async function loadBookings() {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch("/api/my-bookings", {
      credentials: "same-origin"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
    bookings.value = result.bookings || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function canCancel(booking) {
  const start = new Date(`${booking.date}T${booking.time}:00`);
  return booking.status === "CONFIRMED" &&
    !Number.isNaN(start.getTime()) && start.getTime() > Date.now();
}

async function cancelBooking(booking) {
  if (!canCancel(booking) || cancellingId.value !== null) return;
  if (!window.confirm(`Cancel booking #${booking.bookingId}? This will release your seats.`)) {
    return;
  }
  cancellingId.value = booking.bookingId;
  error.value = "";
  message.value = "";
  try {
    const response = await fetch(`/api/bookings/${booking.bookingId}/cancel`, {
      method: "PATCH",
      credentials: "same-origin"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
    message.value = result.message || "Booking cancelled";
    await loadBookings();
  } catch (err) {
    error.value = err.message;
  } finally {
    cancellingId.value = null;
  }
}

onMounted(loadBookings);
</script>

<template>
  <main class="bookings-page">
    <h1>My Bookings</h1>
    <p v-if="message" class="success" role="status">{{ message }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="loading">Loading bookings...</p>
    <p v-else-if="!error && bookings.length === 0">You have no bookings yet.</p>
    <section v-else class="booking-list">
      <article v-for="booking in bookings" :key="booking.bookingId" class="booking-card">
        <h2>{{ booking.movieTitle }}</h2>
        <p>Booking ID: {{ booking.bookingId }}</p>
        <p>Date: {{ booking.date }}</p>
        <p>Time: {{ booking.time }}</p>
        <p>Hall: {{ booking.hall }}</p>
        <p>Seats: {{ booking.seats || "None" }}</p>
        <p>Total: RM {{ Number(booking.totalPrice).toFixed(2) }}</p>
        <strong>Status: {{ booking.status }}</strong>
        <div v-if="canCancel(booking)" class="actions">
          <button
            type="button"
            :disabled="cancellingId !== null"
            @click="cancelBooking(booking)"
          >
            {{ cancellingId === booking.bookingId ? "Cancelling..." : "Cancel Booking" }}
          </button>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.bookings-page { max-width: 800px; margin: 30px auto; padding: 20px; }
.booking-list { display: grid; gap: 16px; }
.booking-card { padding: 18px; border: 1px solid #ccc; border-radius: 10px; }
.actions { margin-top: 18px; }
.actions button { padding: 10px 14px; cursor: pointer; }
.error { color: #b00020; }
.success { color: #157347; }
</style>
