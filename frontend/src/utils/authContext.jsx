import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "./axios";

// Create the auth context
const AuthContext = createContext(null);

// Set auth header helper function
const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return true;
  } else {
    delete api.defaults.headers.common["Authorization"];
    return false;
  }
};

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || null
  );
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  // Derived state for isAuthenticated
  const isAuthenticated = !!user?.isAuthenticated;

  // Function to clear authentication state
  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiry");
    setAuthHeader(null);
    setToken(null);
    setRefreshToken(null);
    setTokenExpiry(null);
    setUser(null);
  }, []);

  // Function to refresh the access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      console.log("[AUTH] Refreshing access token");
      const response = await api.post("/users/refresh-token", {
        refreshToken: refreshToken,
      });

      if (response.data?.success) {
        const {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn,
        } = response.data;

        // Calculate token expiry time (current time + expiresIn seconds)
        const expiryTime = new Date().getTime() + expiresIn * 1000;

        // Save new tokens and expiry time
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        localStorage.setItem("tokenExpiry", expiryTime.toString());

        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setTokenExpiry(expiryTime);
        setAuthHeader(newToken);

        console.log("[AUTH] Token refreshed successfully");
        return true;
      }
    } catch (error) {
      console.error("[AUTH] Failed to refresh token:", error);
      clearAuth();
    }

    return false;
  }, [refreshToken, clearAuth]);

  // Check token validity and refresh if needed
  const checkTokenValidity = useCallback(async () => {
    // If no token exists, clear auth state
    if (!token) {
      clearAuth();
      return false;
    }

    // Get token expiry from localStorage
    const savedExpiry = localStorage.getItem("tokenExpiry");
    const expiryTime = savedExpiry ? parseInt(savedExpiry, 10) : null;

    // Set token expiry in state if not set
    if (!tokenExpiry && expiryTime) {
      setTokenExpiry(expiryTime);
    }

    // Check if token is close to expiry (within 5 minutes)
    const currentTime = new Date().getTime();
    const isTokenExpiringSoon = expiryTime && expiryTime - currentTime < 300000; // 5 minutes

    if (isTokenExpiringSoon) {
      console.log("[AUTH] Token is expiring soon, refreshing");
      return await refreshAccessToken();
    }

    // Token is still valid
    return true;
  }, [token, tokenExpiry, refreshAccessToken, clearAuth]);

  // Check if user is authenticated on initial load and token changes
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Set auth header for all future requests
        const headerSet = setAuthHeader(token);

        if (!headerSet) {
          console.log("[AUTH] Failed to set auth header");
          clearAuth();
          setLoading(false);
          return;
        }

        try {
          // Check token validity
          const isTokenValid = await checkTokenValidity();

          if (!isTokenValid) {
            console.log("[AUTH] Token is invalid or expired");
            clearAuth();
            setLoading(false);
            return;
          }

          // For demo purposes, set user as authenticated
          setUser({
            isAuthenticated: true,
            id: "demo-user-id",
            email: "demo@example.com",
          });

          // In a real app, you would validate the token with the server
          // const response = await api.get("/users/me");
          // setUser({ isAuthenticated: true, ...response.data.user });
        } catch (error) {
          console.log("[AUTH] Token validation failed:", error.message);
          clearAuth();
        }
      } else {
        console.log("[AUTH] No token found");
        clearAuth();
      }
      setLoading(false);
    };

    initAuth();
  }, [token, clearAuth, checkTokenValidity]);

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated && token) {
      // Check token validity every minute
      const interval = setInterval(() => {
        checkTokenValidity();
      }, 60000); // 1 minute

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token, checkTokenValidity]);

  // Login function
  const login = async (credentials) => {
    try {
      console.log("[AUTH] Attempting login with:", credentials.email);

      const response = await api.post("/users/login", credentials);
      console.log("[AUTH] Login successful");

      // Get tokens from response
      const {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = response.data;

      if (!newToken) {
        console.log("[AUTH] No token received");
        return {
          success: false,
          error: "Authentication failed. Please try again.",
        };
      }

      // Calculate token expiry time (current time + expiresIn seconds)
      const expiryTime = new Date().getTime() + (expiresIn || 3600) * 1000;

      // Save tokens and expiry to localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("tokenExpiry", expiryTime.toString());

      // Set tokens in state and header
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setTokenExpiry(expiryTime);
      setAuthHeader(newToken);

      // Set user data
      setUser({
        isAuthenticated: true,
        id: response.data.user?.id || "demo-user-id",
        email: response.data.user?.email || credentials.email,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.log("[AUTH] Login error:", error.message);
      return {
        success: false,
        error: "Login failed. Please check your credentials and try again.",
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log("[AUTH] Attempting registration");
      const response = await api.post("/users/register", userData);
      console.log("[AUTH] Registration successful");
      return { success: true, data: response.data };
    } catch (error) {
      console.log("[AUTH] Registration error:", error.message);
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log("[AUTH] Logging out");

    // You might want to call a backend endpoint to invalidate the refresh token
    // api.post("/users/logout", { refreshToken });

    clearAuth();
  };

  // Create auth context value
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken: refreshAccessToken,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
