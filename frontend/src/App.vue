<script setup>
import { RouterView } from "vue-router";
import AuthNav from "./components/AuthNav.vue";
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎬 Cinema Booking System</h1>
    </header>

    <main>
      <AuthNav />
      
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

