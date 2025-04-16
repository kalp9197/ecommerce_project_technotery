import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid, clear it from localStorage
    if (error.response && error.response.status === 401) {
      console.log("[API] Authentication error, clearing token");

      // Don't remove token on login/register endpoints to avoid infinite loops
      const isAuthEndpoint =
        error.config.url.includes("/users/login") ||
        error.config.url.includes("/users/register");

      if (!isAuthEndpoint) {
        localStorage.removeItem("token");

        // Remove Authorization header
        if (api.defaults && api.defaults.headers) {
          delete api.defaults.headers.common["Authorization"];
        }

        // Could redirect to login here if needed
        // window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
