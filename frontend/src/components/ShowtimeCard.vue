<script setup>
import { RouterLink } from "vue-router";
defineProps({ show: { type: Object, required: true } });
</script>

<template>
  <RouterLink :to="{ name: 'seats', params: { id: show.id } }" class="showtime-card card">
    <strong class="show-time">{{ show.time }}</strong>
    <span class="muted">{{ show.hall }}</span>
    <span class="show-price">RM {{ Number(show.price).toFixed(2) }}</span>
    <span class="show-link">Select seats <span aria-hidden="true">→</span></span>
  </RouterLink>
</template>

<style scoped>
.showtime-card { display: flex; flex-direction: column; gap: .55rem; padding: 1.1rem; text-decoration: none; color: inherit; transition: transform .12s ease, border-color .12s ease; }
.showtime-card:hover { transform: translateY(-2px); border-color: #795dc3; }
.showtime-card:focus-visible { outline: 3px solid #795dc3; outline-offset: 3px; }
.show-time { font-size: 1.5rem; }
.show-price { font-weight: 750; }
.show-link { color: #6244b0; font-size: .875rem; font-weight: 700; margin-top: .2rem; }
</style>
