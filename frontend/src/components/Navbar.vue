<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuth } from "../auth/useAuth";
const router = useRouter();
const { user, refreshUser, logout } = useAuth();
const error = ref("");
onMounted(async () => {
  try { await refreshUser(); } catch { error.value = "Could not check login status."; }
});
async function handleLogout() {
  error.value = "";
  try { await logout(); await router.push("/"); }
  catch (err) { error.value = err.message; }
}
</script>

<template>
  <header class="site-header">
    <div class="nav-container">
      <RouterLink to="/" class="brand" aria-label="Cinema Booking home">🎬 <span>CinemaBooking</span></RouterLink>
      <nav class="nav-links" aria-label="Main navigation">
        <RouterLink to="/" exact-active-class="active">Movies</RouterLink>
        <template v-if="user">
          <RouterLink to="/my-bookings" active-class="active">My Bookings</RouterLink>
          <span class="account" :title="user.email">{{ user.email }}</span>
          <button type="button" class="logout" @click="handleLogout">Log out</button>
        </template>
        <template v-else>
          <RouterLink to="/login" active-class="active">Log in</RouterLink>
          <RouterLink to="/register" class="register-link">Sign up</RouterLink>
        </template>
      </nav>
    </div>
    <p v-if="error" class="nav-error" role="alert">{{ error }}</p>
  </header>
</template>

<style scoped>
.site-header { background: #141d31; color: #fff; }
.nav-container { max-width: 1160px; margin: auto; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.brand { color: #fff; text-decoration: none; font-weight: 800; font-size: 1.22rem; letter-spacing: -.025em; white-space: nowrap; }
.nav-links { display: flex; gap: .35rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.nav-links a, .logout { font: inherit; color: #dfe5f3; background: none; border: 0; padding: .5rem .75rem; text-decoration: none; border-radius: 8px; cursor: pointer; font-size: .91rem; }
.nav-links a:hover, .nav-links a.active, .logout:hover { background: #293550; color: white; }
.nav-links .register-link { background: #785dc0; color: white; }
.account { max-width: 200px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: .8rem; color: #aebdd7; padding: .3rem; }
.nav-error { margin: 0; padding: .25rem 1.5rem .7rem; text-align: center; color: #ffced0; }
@media (max-width: 700px) { .nav-container { flex-wrap: wrap; justify-content: center; padding: 1rem; } .brand { width: 100%; text-align: center; } .nav-links { justify-content: center; } .account { max-width: 125px; } }
</style>
