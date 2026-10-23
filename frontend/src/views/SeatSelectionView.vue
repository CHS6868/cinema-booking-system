<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const data = ref(null);
const selectedSeats = ref([]);
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const success = ref("");

// Organize seats by row
const rows = computed(() => {
  if (!data.value) return [];

  return ["A", "B", "C", "D"].map(row => ({
    name: row,
    seats: data.value.seats.filter(s => s.id.startsWith(row))
  }));
});

// Calculate total price
const totalPrice = computed(() => {
  return selectedSeats.value.length *
    (data.value?.showtime.price || 0);
});

async function loadSeats() {
  const response = await fetch(
    `/api/showtimes/${route.params.id}/seats`
  );

  if (!response.ok) {
    throw new Error("Unable to load seat information");
  }

  data.value = await response.json();
}

function toggleSeat(seat) {
  if (seat.status === "booked") return;

  if (selectedSeats.value.includes(seat.id)) {
    selectedSeats.value = selectedSeats.value.filter(
      id => id !== seat.id
    );
  } else if (selectedSeats.value.length < 6) {
    selectedSeats.value.push(seat.id);
  }
}

async function confirmBooking() {
  if (selectedSeats.value.length === 0) return;

  submitting.value = true;
  error.value = "";
  success.value = "";

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        showtimeId: Number(route.params.id),
        seatIds: selectedSeats.value
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Booking failed");
    }

    success.value = `Demo Booking #${result.id} confirmed! Total: RM ${result.totalPrice.toFixed(2)}`;

    selectedSeats.value = [];
    await loadSeats();
  } catch (err) {
    error.value = err.message;
    selectedSeats.value = [];

    try {
      await loadSeats();
    } catch {
      // Keep the original error visible.
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    await loadSeats();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="page">
    <p v-if="loading">Loading seats...</p>

    <template v-else-if="data">
      <RouterLink
        :to="{ name: 'movie-details', params: { id: data.showtime.movieId } }"
      >
        ← Back to Showtimes
      </RouterLink>

      <h1>Select Your Seats</h1>
      <h2>{{ data.showtime.movieTitle }}</h2>

      <p>
        {{ data.showtime.date }} |
        {{ data.showtime.time }} |
        {{ data.showtime.hall }}
      </p>

      <div class="screen">SCREEN</div>

      <div class="seat-map">
        <div v-for="row in rows" :key="row.name" class="seat-row">
          <strong>{{ row.name }}</strong>

          <button
            v-for="seat in row.seats"
            :key="seat.id"
            class="seat"
            :class="{
              booked: seat.status === 'booked',
              selected: selectedSeats.includes(seat.id)
            }"
            :disabled="seat.status === 'booked' || submitting"
            :aria-pressed="selectedSeats.includes(seat.id)"
            :aria-label="`Seat ${seat.id}, ${seat.status}`"
            @click="toggleSeat(seat)"
          >
            {{ seat.id }}
          </button>
        </div>
      </div>

      <div class="legend">
        <span>⬜ Available</span>
        <span>🟩 Selected</span>
        <span>⬛ Booked</span>
      </div>

      <div class="summary">
        <h3>Booking Summary</h3>
        <p>Seats: {{ selectedSeats.join(", ") || "None" }}</p>
        <p>Tickets: {{ selectedSeats.length }}</p>
        <h3>Total: RM {{ totalPrice.toFixed(2) }}</h3>

        <button
          class="confirm"
          :disabled="selectedSeats.length === 0 || submitting"
          @click="confirmBooking"
        >
          {{ submitting ? "Processing..." : "Confirm Demo Booking" }}
        </button>

        <p v-if="success" class="success">{{ success }}</p>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </template>

    <p v-else-if="error" class="error">{{ error }}</p>
  </section>
</template>

<style scoped>
.page {
  max-width: 950px;
  margin: 40px auto;
  padding: 20px;
}

.screen {
  margin: 40px auto;
  padding: 14px;
  max-width: 550px;
  background: #cbd5e1;
  text-align: center;
  border-radius: 8px;
  letter-spacing: 4px;
}

.seat-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seat-row strong {
  width: 20px;
}

.seat {
  width: 48px;
  height: 43px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
}

.seat.selected {
  background: #16a34a;
  color: white;
}

.seat.booked {
  background: #64748b;
  color: white;
  cursor: not-allowed;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-top: 25px;
  flex-wrap: wrap;
}

.summary {
  max-width: 450px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
}

.confirm {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  background: #1e293b;
  color: white;
  cursor: pointer;
}

.confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success {
  color: #15803d;
}

.error {
  color: #dc2626;
}
</style>
