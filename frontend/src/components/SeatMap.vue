<script setup>
import { computed } from "vue";

const props = defineProps({
  seats: { type: Array, required: true },
  selectedSeats: { type: Array, required: true },
  disabled: { type: Boolean, default: false },
  maxSeats: { type: Number, default: 6 }
});
const emit = defineEmits(["toggle"]);
const rows = computed(() => {
  const groups = new Map();
  for (const seat of props.seats) {
    const row = String(seat.id).match(/^[A-Za-z]+/)?.[0] || "Other";
    if (!groups.has(row)) groups.set(row, []);
    groups.get(row).push(seat);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([name, seats]) => ({
    name,
    seats: seats.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
  }));
});
function unavailable(seat) {
  return props.disabled || seat.status === "booked" ||
    (!props.selectedSeats.includes(seat.id) && props.selectedSeats.length >= props.maxSeats);
}
</script>

<template>
  <section class="seat-map-area" aria-label="Seat selection">
    <div class="screen" aria-hidden="true">SCREEN</div>
    <div class="seat-scroll">
      <div class="seat-rows">
        <div v-for="row in rows" :key="row.name" class="seat-row">
          <strong class="row-label">{{ row.name }}</strong>
          <button
            v-for="seat in row.seats"
            :key="seat.id"
            type="button"
            class="seat"
            :class="{ booked: seat.status === 'booked', selected: selectedSeats.includes(seat.id) }"
            :disabled="unavailable(seat)"
            :aria-pressed="selectedSeats.includes(seat.id)"
            :aria-label="`Seat ${seat.id}, ${seat.status === 'booked' ? 'booked' : selectedSeats.includes(seat.id) ? 'selected' : 'available'}`"
            @click="emit('toggle', seat)"
          >{{ seat.id }}</button>
        </div>
      </div>
    </div>
    <div class="legend" aria-label="Seat legend">
      <span><i class="legend-dot available"></i>Available</span>
      <span><i class="legend-dot selected"></i>Selected</span>
      <span><i class="legend-dot booked"></i>Booked</span>
    </div>
    <p class="muted seat-tip">Select up to {{ maxSeats }} seats. Scroll horizontally on small screens.</p>
  </section>
</template>

<style scoped>
.seat-map-area { padding: 1.2rem 0; }
.screen { margin: 0 auto 2rem; max-width: 480px; padding: .75rem; text-align: center; background: linear-gradient(#d7dcef, #f4f6ff); border-top: 4px solid #7b66b9; border-radius: 10px; letter-spacing: .3em; font-size: .8rem; font-weight: 800; }
.seat-scroll { overflow-x: auto; padding: 0 .5rem .6rem; }
.seat-rows { display: grid; justify-content: center; gap: .8rem; min-width: max-content; }
.seat-row { display: flex; justify-content: center; align-items: center; gap: .6rem; }
.row-label { width: 1.6rem; text-align: center; }
.seat { min-width: 43px; min-height: 43px; border: 1px solid #bdc5d2; border-radius: 9px; background: #e7eaf1; color: #1e293b; cursor: pointer; font-weight: 700; }
.seat:hover:not(:disabled) { border-color: #7253c1; }
.seat.selected { background: #187a58; color: white; border-color: #187a58; }
.seat.booked { background: #677386; color: white; cursor: not-allowed; }
.seat:disabled:not(.booked):not(.selected) { opacity: .6; cursor: not-allowed; }
.legend { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 1.4rem; font-size: .85rem; }
.legend span { display: flex; align-items: center; gap: .4rem; }
.legend-dot { display: inline-block; width: .95rem; height: .95rem; border-radius: 4px; }
.legend-dot.available { background: #e7eaf1; border: 1px solid #bdc5d2; }
.legend-dot.selected { background: #187a58; }
.legend-dot.booked { background: #677386; }
.seat-tip { text-align: center; font-size: .8rem; }
@media (max-width: 520px) { .seat-row { gap: .3rem; } .seat { min-width: 39px; min-height: 41px; } }
</style>
