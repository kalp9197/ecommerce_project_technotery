import React from "react";
import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import { ModeToggle } from "@/components/mode-toggle";
import { DockDemo } from "@/components/DockDemo";
import { useAuth } from "@/utils/authContext";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4 bg-background border-b">
        <h1 className="text-xl font-bold">My App</h1>
        <div className="flex items-center gap-4">
          <UserMenu />
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <DockDemo />
        </div>
      </main>
    </div>
  );
}

// User menu component for displaying login status and logout button
function UserMenu() {
  const { isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={logout}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      Logout
    </button>
  );
}
