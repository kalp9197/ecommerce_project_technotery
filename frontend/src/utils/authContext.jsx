import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./axios";

// Create the auth context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        // Set auth header for all future requests
        if (api.defaults && api.defaults.headers) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        try {
          console.log("[AUTH] Using stored token");

          // For the mock API, set a demo user
          setUser({
            isAuthenticated: true,
            id: "demo-user-id",
            email: "demo@example.com",
          });
        } catch (error) {
          console.log("[AUTH] Token validation failed, clearing session");
          localStorage.removeItem("token");

          if (api.defaults && api.defaults.headers) {
            delete api.defaults.headers.common["Authorization"];
          }

          setToken(null);
          setUser(null);
        }
      } else {
        console.log("[AUTH] No token found");
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      console.log("[AUTH] Attempting login with:", credentials.email);

      const response = await api.post("/users/login", credentials);
      console.log("[AUTH] Login successful");

      // Get token from response
      const { token } = response.data;

      if (!token) {
        console.log("[AUTH] No token received");
        return {
          success: false,
          error: "Authentication failed. Please try again.",
        };
      }

      // Save token to localStorage and set auth header
      localStorage.setItem("token", token);

      if (api.defaults && api.defaults.headers) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      setToken(token);
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
    localStorage.removeItem("token");

    if (api.defaults && api.defaults.headers) {
      delete api.defaults.headers.common["Authorization"];
    }

    setToken(null);
    setUser(null);
  };

  // Create auth context value
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user?.isAuthenticated,
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
