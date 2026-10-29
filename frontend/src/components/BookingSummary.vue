<script setup>
import { computed } from "vue";
const props = defineProps({
  selectedSeats: { type: Array, required: true },
  price: { type: Number, default: 0 },
  submitting: { type: Boolean, default: false }
});
const emit = defineEmits(["confirm"]);
const total = computed(() => props.selectedSeats.length * props.price);
</script>

<template>
  <aside class="summary card" aria-label="Booking summary">
    <h2>Booking summary</h2>
    <div class="summary-line"><span>Selected seats</span><strong>{{ selectedSeats.join(', ') || 'None' }}</strong></div>
    <div class="summary-line"><span>Tickets</span><strong>{{ selectedSeats.length }}</strong></div>
    <div class="summary-line"><span>Price per seat</span><strong>RM {{ price.toFixed(2) }}</strong></div>
    <div class="summary-line total"><span>Total</span><strong>RM {{ total.toFixed(2) }}</strong></div>
    <button class="btn btn-primary" type="button" :disabled="!selectedSeats.length || submitting" @click="emit('confirm')">
      {{ submitting ? 'Processing…' : 'Confirm demo booking' }}
    </button>
    <p class="muted note">Demo reservation only — no payment collected.</p>
  </aside>
</template>

<style scoped>
.summary { padding: 1.5rem; }
.summary h2 { margin-top: 0; font-size: 1.2rem; }
.summary-line { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: .65rem 0; font-size: .94rem; }
.summary-line span { color: #5d687d; }
.summary-line strong { text-align: right; overflow-wrap: anywhere; }
.summary-line.total { border-top: 1px solid #dce2ea; margin: .6rem 0 1rem; padding-top: 1rem; font-size: 1.15rem; }
.summary .btn { width: 100%; }
.note { font-size: .75rem; text-align: center; margin-bottom: 0; }
</style>
