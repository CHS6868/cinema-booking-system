
<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../auth/useAuth";

const router = useRouter();

const {
  user,
  refreshUser,
  logout
} = useAuth();

const error = ref("");

onMounted(async () => {
  try {
    await refreshUser();
  } catch (err) {
    error.value = "Could not check login status.";
  }
});

async function handleLogout() {
  error.value = "";

  try {
    await logout();
    await router.push("/");

  } catch (err) {
    error.value = err.message;
  }
}
</script>

<template>
  <div class="auth-nav">

    <nav aria-label="Account navigation">
      <RouterLink to="/">
        Movies
      </RouterLink>

      <template v-if="user">
        <span>
          Signed in: {{ user.email }}
        </span>

        <RouterLink to="/my-bookings">
          My Bookings
        </RouterLink>

        <button type="button" @click="handleLogout">
          Log out
        </button>
      </template>

      <template v-else>
        <RouterLink to="/login">
          Login
        </RouterLink>

        <RouterLink to="/register">
          Register
        </RouterLink>
      </template>
    </nav>

    <p v-if="error" role="alert">
      {{ error }}
    </p>

  </div>
</template>

<style scoped>
.auth-nav {
  padding: 12px 16px;
  border-bottom: 1px solid #9995;
}

nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
}

button {
  cursor: pointer;
}
</style>
