import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
  const [tokenValidated, setTokenValidated] = useState(false);

  // Derived state for isAuthenticated
  const isAuthenticated = !!user?.isAuthenticated;

  // Function to clear authentication state
  const clearAuth = () => {
    localStorage.removeItem("token");
    setAuthHeader(null);
    setToken(null);
    setUser(null);
  };

  // Check token validity periodically
  useEffect(() => {
    // Function to validate token
    const validateToken = async () => {
      if (!token) {
        if (isAuthenticated) {
          console.log("[AUTH] No token but user is authenticated, logging out");
          clearAuth();
        }
        return false;
      }

      try {
        // Set auth header for validation request
        setAuthHeader(token);

        // In a real app, you would make an API call to validate the token
        // For now, we'll just check if the token exists
        return true;
      } catch (error) {
        console.log("[AUTH] Token validation failed:", error.message);
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
  }, [token, isAuthenticated]);

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
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      console.log("[AUTH] Attempting login with:", credentials.email);

      const response = await api.post("/users/login", credentials);
      console.log("[AUTH] Login successful");

      // Get token from response
      const { token: newToken } = response.data;

      if (!newToken) {
        console.log("[AUTH] No token received");
        return {
          success: false,
          error: "Authentication failed. Please try again.",
        };
      }

      // Save token to localStorage
      localStorage.setItem("token", newToken);

      // Set token in state and header
      setToken(newToken);
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
    isAuthenticated,
    tokenValidated,
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
