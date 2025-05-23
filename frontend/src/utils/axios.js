import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue = [];

// Process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is not 401 or we're already retrying, reject immediately
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Don't attempt refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint =
      originalRequest.url.includes("/users/login") ||
      originalRequest.url.includes("/users/register") ||
      originalRequest.url.includes("/users/refresh-token");

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Check if the response indicates we need to login again
    if (error.response.data && error.response.data.requiresLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("refreshCycles");

      if (api.defaults && api.defaults.headers) {
        delete api.defaults.headers.common["Authorization"];
      }

      window.location.href = "/login";
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Mark that we're refreshing and this request is being retried
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Get current token
      const currentToken = localStorage.getItem("token");

      if (!currentToken) {
        throw new Error("No token available for refresh");
      }

      // Call refresh token endpoint
      const response = await api.post("/users/refresh-token", {
        token: currentToken,
      });

      if (response.data.success && response.data.token) {
        const newToken = response.data.token;
        const refreshCycles = response.data.refreshCycles;
        const expiresInMinutes = response.data.expiresInMinutes || 60;

        // Calculate expiry time
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + expiresInMinutes);

        // Update localStorage
        localStorage.setItem("token", newToken);
        localStorage.setItem("tokenExpiry", expiryTime.toISOString());
        localStorage.setItem("refreshCycles", refreshCycles.toString());

        // Update Authorization header
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        // Update the failed request with new token
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        // Process any queued requests
        processQueue(null, newToken);

        // Retry the original request
        return api(originalRequest);
      } else {
        // If refresh failed, clear auth and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        localStorage.removeItem("refreshCycles");

        if (api.defaults && api.defaults.headers) {
          delete api.defaults.headers.common["Authorization"];
        }

        window.location.href = "/login";
        throw new Error("Token refresh failed");
      }
    } catch (refreshError) {
      // Process queued requests with error
      processQueue(refreshError, null);

      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("refreshCycles");

      if (api.defaults && api.defaults.headers) {
        delete api.defaults.headers.common["Authorization"];
      }

      // Redirect to login page
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
