
<script setup>
import { RouterView } from "vue-router";
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎬 Cinema Booking System</h1>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.header {
  background-color: #1e293b;
  color: white;
  padding: 20px;
  text-align: center;
}
</style>

