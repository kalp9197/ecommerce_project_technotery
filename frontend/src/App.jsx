import React from "react";
import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/utils/authContext";
import { CartProvider } from "@/utils/cartContext";
import { WishlistProvider } from "@/utils/wishlistContext";
import PropTypes from "prop-types";

import { PageTransition } from "./components/PageTransition";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, token } = useAuth();
  const location = useLocation();

  // Check if token exists
  const hasToken = !!token;

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

  if (!isAuthenticated || !hasToken) {
    // Redirect to login but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function App() {
  const location = useLocation();

  return (
    <CartProvider>
      <WishlistProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Products page as default route */}
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <Products />
                    </PageTransition>
                  }
                />

                {/* Add redirect from /products to / */}
                <Route path="/products" element={<Navigate to="/" replace />} />

                <Route
                  path="/products/:uuid"
                  element={
                    <PageTransition>
                      <ProductDetail />
                    </PageTransition>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <Cart />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <PageTransition>
                        <Wishlist />
                      </PageTransition>
                    </ProtectedRoute>
                  }
                />

                {/* Auth routes */}
                <Route
                  path="/login"
                  element={
                    <PageTransition>
                      <Login />
                    </PageTransition>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PageTransition>
                      <Register />
                    </PageTransition>
                  }
                />

                {/* Token test route */}
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
