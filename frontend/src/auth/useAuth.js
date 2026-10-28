
import { ref } from "vue";

// Shared authentication state
const user = ref(null);
const sessionChecked = ref(false);

let refreshPromise = null;

// Helper for API requests
async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result.message || `HTTP ${response.status}`
    );

    error.status = response.status;
    throw error;
  }

  return result;
}

// Check current logged-in user
async function refreshUser() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const result = await requestJson("/api/auth/me");
      user.value = result.user;

    } catch (error) {
      if (error.status === 401) {
        user.value = null;
      } else {
        throw error;
      }

    } finally {
      sessionChecked.value = true;
    }

    return user.value;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// Login
async function login(email, password) {
  const result = await requestJson("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  user.value = result.user;
  sessionChecked.value = true;

  return result;
}

// Register
async function register(name, email, password) {
  return requestJson("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  });
}

// Logout
async function logout() {
  await requestJson("/api/auth/logout", {
    method: "POST"
  });

  user.value = null;
  sessionChecked.value = true;
}

export function useAuth() {
  return {
    user,
    sessionChecked,
    refreshUser,
    login,
    register,
    logout
  };
}
