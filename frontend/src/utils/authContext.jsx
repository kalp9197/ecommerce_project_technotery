import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./axios";
import PropTypes from "prop-types";

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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [refreshCycles, setRefreshCycles] = useState(
    parseInt(localStorage.getItem("refreshCycles") || "0")
  );
  const [tokenExpiry, setTokenExpiry] = useState(
    localStorage.getItem("tokenExpiry") || null
  );
  const [loading, setLoading] = useState(true);
  const [tokenValidated, setTokenValidated] = useState(false);

  // Derived state for isAuthenticated
  const isAuthenticated = !!user?.isAuthenticated;

  // Function to clear authentication state
  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("refreshCycles");
    setAuthHeader(null);
    setToken(null);
    setTokenExpiry(null);
    setRefreshCycles(0);
    setUser(null);
  };

  // Function to refresh token
  const refreshToken = async () => {
    if (!token) {
      return { success: false };
    }

    try {
      const response = await api.post("/users/refresh-token", { token });

      if (response.data.success && response.data.token) {
        const newToken = response.data.token;
        const newRefreshCycles = response.data.refreshCycles;
        const expiresInMinutes = response.data.expiresInMinutes || 60;

        // Calculate expiry time
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + expiresInMinutes);

        // Update localStorage
        localStorage.setItem("token", newToken);
        localStorage.setItem("tokenExpiry", expiryTime.toISOString());
        localStorage.setItem("refreshCycles", newRefreshCycles.toString());

        // Update state
        setToken(newToken);
        setTokenExpiry(expiryTime.toISOString());
        setRefreshCycles(newRefreshCycles);
        setAuthHeader(newToken);

        return { success: true, token: newToken };
      } else {
        clearAuth();
        return { success: false };
      }
    } catch {
      // Just clear auth and navigate to login if needed, but 'error' is not available here anymore
      clearAuth();
      navigate("/login");
      return { success: false };
    }
  };

  // Check token validity periodically
  useEffect(() => {
    // Function to validate token
    const validateToken = async () => {
      if (!token) {
        if (isAuthenticated) {
          clearAuth();
        }
        return false;
      }

      try {
        // Set auth header for validation request
        setAuthHeader(token);

        // Check if token is expired based on local expiry time
        if (tokenExpiry) {
          const expiryTime = new Date(tokenExpiry);
          const now = new Date();

          // If token is expired, try to refresh it
          if (now >= expiryTime) {
            // Check if we have refresh cycles left
            if (refreshCycles <= 1) {
              clearAuth();
              return false;
            }

            const refreshResult = await refreshToken();
            return refreshResult.success;
          }
        }

        return true;
      } catch {
        clearAuth();
        return false;
      }
    };

    // Validate token immediately and set up periodic validation
    validateToken().then((isValid) => {
      setTokenValidated(isValid);
    });

    // Set up periodic validation (every minute)
    const intervalId = setInterval(() => {
      validateToken().then((isValid) => {
        setTokenValidated(isValid);
      });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [token, tokenExpiry, refreshCycles, isAuthenticated, navigate]);

  // Check if user is authenticated on initial load and token changes
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Set auth header for all future requests
        const headerSet = setAuthHeader(token);

        if (!headerSet) {
          clearAuth();
          setLoading(false);
          return;
        }

        try {
          // Check if token is expired based on local expiry time
          if (tokenExpiry) {
            const expiryTime = new Date(tokenExpiry);
            const now = new Date();

            // If token is expired, try to refresh it
            if (now >= expiryTime) {
              // Check if we have refresh cycles left
              if (refreshCycles <= 1) {
                clearAuth();
                setLoading(false);
                return;
              }

              const refreshResult = await refreshToken();
              if (!refreshResult.success) {
                clearAuth();
                setLoading(false);
                return;
              }
            }
          }

          // For demo purposes, set user as authenticated
          // In a real app, you would fetch user data from the server
          setUser({
            isAuthenticated: true,
            id: "demo-user-id",
            email: "demo@example.com",
          });
        } catch {
          clearAuth();
        }
      } else {
        clearAuth();
      }
      setLoading(false);
    };

    initAuth();
  }, [token, tokenExpiry, refreshCycles, navigate]);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post("/users/login", credentials);

      // Get token and related data from response
      const {
        token: newToken,
        refreshCycles: cycles,
        expiresInMinutes,
      } = response.data;

      if (!newToken) {
        return {
          success: false,
          error: "Authentication failed. Please try again.",
        };
      }

      // Calculate expiry time
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + (expiresInMinutes || 60));

      // Save auth data to localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("tokenExpiry", expiryTime.toISOString());
      localStorage.setItem("refreshCycles", cycles ? cycles.toString() : "5");

      // Set state
      setToken(newToken);
      setTokenExpiry(expiryTime.toISOString());
      setRefreshCycles(cycles || 5);
      setAuthHeader(newToken);

      // Set user data
      setUser({
        isAuthenticated: true,
        id: response.data.user?.id || "demo-user-id",
        email: response.data.user?.email || credentials.email,
        is_admin: response.data.user?.is_admin || false,
        email_verified: response.data.user?.email_verified || false,
      });

      return { success: true, data: response.data };
    } catch {
      return {
        success: false,
        error: "Login failed. Please check your credentials and try again.",
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post("/users/register", userData);
      return { success: true, data: response.data };
    } catch {
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
  };

  // Create auth context value
  const value = {
    user,
    token,
    refreshCycles,
    tokenExpiry,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated,
    tokenValidated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
