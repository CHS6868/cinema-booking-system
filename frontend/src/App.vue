<script setup>
import { RouterView } from "vue-router";
import Navbar from "./components/Navbar.vue";
</script>

<template>
  <div class="app-shell">
    <Navbar />
    <main id="main-content" class="main-content"><RouterView /></main>
    <footer class="site-footer">Cinema Booking System · Learning project</footer>
  </div>
</template>
