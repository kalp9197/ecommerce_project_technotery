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
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          // You can optionally make a request to verify the token is still valid
          // const response = await api.get("/users/me");
          // setUser({ isAuthenticated: true, ...response.data });

          // For now, just set as authenticated if token exists
          setUser({ isAuthenticated: true });
        } catch (error) {
          console.error("Token validation error:", error);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post("/users/login", credentials);

      // Check if the response contains token in the expected structure
      // Based on the backend's response format
      const { token } = response.data;

      if (!token) {
        console.error("No token received from server");
        return {
          success: false,
          error: "Authentication failed. Please try again.",
        };
      }

      // Save token to localStorage and set auth header
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setToken(token);
      setUser({ isAuthenticated: true });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      return {
        success: false,
        error:
          error.response?.data?.message || "An error occurred during login",
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post("/users/register", userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Register error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
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
