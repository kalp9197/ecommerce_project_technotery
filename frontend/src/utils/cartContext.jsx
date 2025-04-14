import React, { createContext, useContext, useState, useEffect } from "react";
import { getCart } from "./cartService";
import { useAuth } from "./authContext";

// Create the cart context
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Function to fetch cart data
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setCartCount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await getCart();
      if (response.success && response.data) {
        setCartItems(response.data);
        // Calculate total quantity
        const totalItems = response.data.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setCartCount(totalItems);
      } else {
        setCartItems([]);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart in context:", error);
      setCartItems([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Update cart when authentication status changes
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // Create context value
  const value = {
    cartItems,
    cartCount,
    loading,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
