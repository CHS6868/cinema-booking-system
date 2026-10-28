
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../auth/useAuth";

const router = useRouter();
const { register } = useAuth();

const name = ref("");
const email = ref("");
const password = ref("");

const loading = ref(false);
const error = ref("");

async function submitRegistration() {
  error.value = "";
  loading.value = true;

  try {
    await register(
      name.value,
      email.value,
      password.value
    );

    await router.push({
      name: "login",
      query: { registered: "1" }
    });

  } catch (err) {
    error.value = err.message;

  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <h1>Create Account</h1>

    <form @submit.prevent="submitRegistration">

      <label>
        Name
        <input
          v-model.trim="name"
          autocomplete="name"
          maxlength="60"
          required
        />
      </label>

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
          autocomplete="new-password"
          minlength="12"
          maxlength="128"
          required
        />
      </label>

      <small>
        Use 12–128 characters.
        Don't reuse passwords from other accounts.
      </small>

      <p v-if="error" class="error" role="alert">
        {{ error }}
      </p>

      <button type="submit" :disabled="loading">
        {{ loading ? "Registering..." : "Register" }}
      </button>

    </form>

    <p>
      Already registered?
      <RouterLink to="/login">Log in</RouterLink>
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
