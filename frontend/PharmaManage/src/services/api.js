import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_BASE_URL || "http://localhost:3000/api",
});

let isRedirecting = false;

// Global In-Flight Request Tracker (Prevents multi-click duplicate submissions across all pages)
const inFlightRequests = new Map();

// Helper to generate unique request signature
const getRequestSignature = (config) => {
  const method = (config.method || "GET").toUpperCase();
  const url = config.url || "";
  const data = typeof config.data === "object" ? JSON.stringify(config.data) : (config.data || "");
  const params = typeof config.params === "object" ? JSON.stringify(config.params) : "";
  return `${method}:${url}:${data}:${params}`;
};

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  const method = (config.method || "GET").toUpperCase();

  // Deduplicate and lock in-flight mutating requests (POST, PUT, PATCH, DELETE)
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const signature = getRequestSignature(config);

    if (inFlightRequests.has(signature)) {
      // Create an AbortController to cleanly cancel the duplicate request before hitting network
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort("__DUPLICATE_IN_FLIGHT__");

      toast("Action already processing. Please wait...", {
        id: "in-flight-throttle",
        icon: "⏳",
        duration: 2000
      });

      return config;
    }

    inFlightRequests.set(signature, Date.now());
    config.__requestSignature = signature;
  }

  return config;
});

// Helper to release in-flight lock
const releaseInFlight = (config) => {
  if (config?.__requestSignature) {
    setTimeout(() => {
      inFlightRequests.delete(config.__requestSignature);
    }, 300);
  }
};

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    releaseInFlight(response.config);
    return response;
  },

  (error) => {
    releaseInFlight(error.config);

    // Silent handling for client-side deduplicated requests
    if (
      error.message === "__DUPLICATE_IN_FLIGHT__" ||
      error.code === "ERR_CANCELED" && error.message?.includes("__DUPLICATE_IN_FLIGHT__")
    ) {
      return Promise.reject({
        isDuplicate: true,
        message: "Duplicate request prevented."
      });
    }

    // Backend duplicate detection
    if (error.response?.status === 409 && error.response?.data?.isDuplicate) {
      toast(error.response.data.message || "Request already in progress. Please wait...", {
        id: "backend-duplicate-notice",
        icon: "⏳",
        duration: 2500
      });
      return Promise.reject(error);
    }

    const storedUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    // Token expired / invalid
    if (
      error.response?.status === 401 &&
      storedUser?.token &&
      !isRedirecting &&
      window.location.pathname !== "/login"
    ) {
      isRedirecting = true;

      // Remove expired user
      localStorage.removeItem("user");

      toast.error("Session expired");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;