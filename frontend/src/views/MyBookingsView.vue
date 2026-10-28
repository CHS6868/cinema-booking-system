
<script setup>
import { ref, onMounted } from "vue";

const bookings = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const response = await fetch("/api/my-bookings", {
      credentials: "same-origin"
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to load bookings"
      );
    }

    bookings.value = result.bookings || [];

  } catch (err) {
    error.value = err.message;

  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="bookings-page">
    <h1>My Bookings</h1>

    <p v-if="loading">Loading bookings...</p>

    <p v-else-if="error" class="error">
      {{ error }}
    </p>

    <p v-else-if="bookings.length === 0">
      You have no bookings yet.
    </p>

    <div v-else class="booking-list">
      <div
        v-for="booking in bookings"
        :key="booking.bookingId"
        class="booking-card"
      >
        <h2>{{ booking.movieTitle }}</h2>

        <p>Booking ID: {{ booking.bookingId }}</p>

        <p>Date: {{ booking.date }}</p>
        <p>Time: {{ booking.time }}</p>
        <p>Hall: {{ booking.hall }}</p>
        <p>Seats: {{ booking.seats }}</p>

        <p>
          Total: RM
          {{ Number(booking.totalPrice).toFixed(2) }}
        </p>

        <strong>Status: {{ booking.status }}</strong>
      </div>
    </div>
  </main>
</template>

<style scoped>
.bookings-page {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
}

.booking-list {
  display: grid;
  gap: 16px;
}

.booking-card {
  padding: 18px;
  border: 1px solid #ccc;
  border-radius: 10px;
}

.error {
  color: red;
}
</style>
