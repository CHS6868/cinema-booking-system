
<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../auth/useAuth";

const router = useRouter();
const route = useRoute();

const { login } = useAuth();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function submitLogin() {
  error.value = "";
  loading.value = true;

  try {
    await login(email.value, password.value);

    const redirect = route.query.redirect;

    const safePath =
      typeof redirect === "string" &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
        ? redirect
        : "/";

    await router.replace(safePath);

  } catch (err) {
    error.value = err.message;

  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page card">

    <h1>Login</h1>

    <p v-if="route.query.registered">
      Registration successful. Please log in.
    </p>

    <form @submit.prevent="submitLogin">

      <label>
        Email
        <input
          v-model.trim="email"
          type="email"
          autocomplete="email"
          required
        />
      </label>

      <label>
        Password
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="error" class="error" role="alert">
        {{ error }}
      </p>

      <button type="submit" :disabled="loading">
        {{ loading ? "Logging in..." : "Log in" }}
      </button>

    </form>

    <p>
      New user?
      <RouterLink to="/register">
        Create an account
      </RouterLink>
    </p>

  </main>
</template>

<style scoped>
.auth-page {
  max-width: 440px;
  margin: 3rem auto;
  padding: 2rem;
}

form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
}

input {
  padding: 12px;
  border: 1px solid #c7d0df;
  border-radius: 6px;
}

button {
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: #5539a4;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.error {
  color: #a51937;
}
</style>
