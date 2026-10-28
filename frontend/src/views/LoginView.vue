
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
  <main class="auth-page">

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
  max-width: 420px;
  margin: 36px auto;
  padding: 20px;
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
  padding: 10px;
  border: 1px solid #999;
  border-radius: 6px;
}

button {
  padding: 11px;
  cursor: pointer;
}

.error {
  color: #b00020;
}
</style>
