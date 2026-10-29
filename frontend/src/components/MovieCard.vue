<script setup>
import { RouterLink } from "vue-router";

defineProps({ movie: { type: Object, required: true } });
</script>

<template>
  <article class="movie-card card">
    <div class="poster" aria-hidden="true">🎞️</div>
    <div class="movie-content">
      <p class="eyebrow">NOW SHOWING</p>
      <h3>{{ movie.title }}</h3>
      <p class="muted">{{ movie.genre || 'Cinema' }} · {{ movie.duration }} min</p>
      <p class="availability">{{ movie.showtimeCount ?? 0 }} available showtimes</p>
      <RouterLink :to="{ name: 'movie-details', params: { id: movie.id } }" class="btn btn-primary movie-link">
        View showtimes <span aria-hidden="true">→</span>
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.movie-card { overflow: hidden; padding: 0; display: flex; flex-direction: column; }
.poster { min-height: 145px; background: linear-gradient(145deg, #192b49, #504083); color: white; display: grid; place-items: center; font-size: 4rem; }
.movie-content { display: flex; flex-direction: column; flex: 1; gap: .55rem; padding: 1.3rem; }
.movie-content h3 { margin: 0; font-size: 1.25rem; line-height: 1.35; }
.movie-content p { margin: 0; }
.eyebrow { color: #6a52b8; font-size: .7rem; letter-spacing: .15em; font-weight: 800; }
.availability { margin-top: auto !important; font-size: .9rem; font-weight: 650; }
.movie-link { margin-top: .6rem; justify-content: space-between; }
</style>
