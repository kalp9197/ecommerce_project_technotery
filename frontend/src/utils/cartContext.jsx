import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCart,
  addToCart,
  updateCartItem as updateCartItemService,
  removeFromCart,
  clearCart as clearCartService,
} from "./cartService";
import { useAuth } from "./authContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(new Set());
  const { isAuthenticated } = useAuth();

  // Function to fetch cart data
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setCartCount(0);
      setCartTotal("0.00");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getCart();
      if (response.success && response.data) {
        setCartItems(response.data.items || []);
        setCartCount(response.data.total_items || 0);
        setCartTotal(response.data.total_price || "0.00");
      } else {
        setCartItems([]);
        setCartCount(0);
        setCartTotal("0.00");
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (error) {
      console.error("Error fetching cart in context:", error);
      setCartItems([]);
      setCartCount(0);
      setCartTotal("0.00");
      setError("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update cart when authentication status changes
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  // Add item to cart
  const addItem = async (productId, quantity = 1, productDetails = {}) => {
    if (!isAuthenticated) return;

    setPendingOperations((prev) => new Set(prev).add(productId));
    setError(null);

    // Optimistic update
    const tempId = Date.now();
    const optimisticItem = {
      id: tempId,
      product_id: productId,
      quantity,
      price: productDetails.price || 0,
      ...productDetails,
      isOptimistic: true,
    };

    setCartItems((prev) => [...prev, optimisticItem]);
    setCartCount((prev) => prev + quantity);
    setCartTotal((prev) =>
      (
        parseFloat(prev) +
        (parseFloat(productDetails.price) || 0) * quantity
      ).toFixed(2)
    );

    try {
      const response = await addToCart(productId, quantity);
      if (response.success) {
        await fetchCart(); // Refresh to get server state
      } else {
        // Revert optimistic update
        setCartItems((prev) => prev.filter((item) => item.id !== tempId));
        setCartCount((prev) => prev - quantity);
        setCartTotal((prev) =>
          (
            parseFloat(prev) -
            (parseFloat(productDetails.price) || 0) * quantity
          ).toFixed(2)
        );
        setError(response.message || "Failed to add item to cart");
      }
    } catch (error) {
      // Revert optimistic update
      setCartItems((prev) => prev.filter((item) => item.id !== tempId));
      setCartCount((prev) => prev - quantity);
      setCartTotal((prev) =>
        (
          parseFloat(prev) -
          (parseFloat(productDetails.price) || 0) * quantity
        ).toFixed(2)
      );
      setError("Failed to add item to cart. Please try again.");
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  // Update cart item
  const updateItem = async (itemId, newQuantity, oldQuantity) => {
    if (!isAuthenticated || newQuantity < 1) return;

    setPendingOperations((prev) => new Set(prev).add(itemId));
    setError(null);

    const item = cartItems.find((item) => item.id === itemId);
    if (!item) return;

    const quantityDiff = newQuantity - oldQuantity;
    const priceDiff = (parseFloat(item.price) || 0) * quantityDiff;

    // Optimistic update
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    setCartCount((prev) => prev + quantityDiff);
    setCartTotal((prev) => (parseFloat(prev) + priceDiff).toFixed(2));

    try {
      const response = await updateCartItemService(itemId, newQuantity);
      if (!response.success) {
        // Revert optimistic update
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, quantity: oldQuantity } : item
          )
        );
        setCartCount((prev) => prev - quantityDiff);
        setCartTotal((prev) => (parseFloat(prev) - priceDiff).toFixed(2));
        setError(response.message || "Failed to update item quantity");
      }
    } catch (error) {
      // Revert optimistic update
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: oldQuantity } : item
        )
      );
      setCartCount((prev) => prev - quantityDiff);
      setCartTotal((prev) => (parseFloat(prev) - priceDiff).toFixed(2));
      setError("Failed to update item quantity. Please try again.");
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    if (!isAuthenticated) return;

    setPendingOperations((prev) => new Set(prev).add(itemId));
    setError(null);

    const item = cartItems.find((item) => item.id === itemId);
    if (!item) return;

    const itemTotal = (parseFloat(item.price) || 0) * item.quantity;

    // Optimistic update
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    setCartCount((prev) => prev - item.quantity);
    setCartTotal((prev) => (parseFloat(prev) - itemTotal).toFixed(2));

    try {
      const response = await removeFromCart(itemId);
      if (!response.success) {
        // Revert optimistic update
        setCartItems((prev) => [...prev, item]);
        setCartCount((prev) => prev + item.quantity);
        setCartTotal((prev) => (parseFloat(prev) + itemTotal).toFixed(2));
        setError(response.message || "Failed to remove item");
      }
    } catch (error) {
      // Revert optimistic update
      setCartItems((prev) => [...prev, item]);
      setCartCount((prev) => prev + item.quantity);
      setCartTotal((prev) => (parseFloat(prev) + itemTotal).toFixed(2));
      setError("Failed to remove item. Please try again.");
    } finally {
      setPendingOperations((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) return;

    const previousItems = [...cartItems];
    const previousCount = cartCount;
    const previousTotal = cartTotal;

    // Optimistic update
    setCartItems([]);
    setCartCount(0);
    setCartTotal("0.00");

    try {
      const response = await clearCartService();
      if (!response.success) {
        // Revert optimistic update
        setCartItems(previousItems);
        setCartCount(previousCount);
        setCartTotal(previousTotal);
        setError(response.message || "Failed to clear cart");
      }
    } catch (error) {
      // Revert optimistic update
      setCartItems(previousItems);
      setCartCount(previousCount);
      setCartTotal(previousTotal);
      setError("Failed to clear cart. Please try again.");
    }
  };

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    error,
    isItemPending: (id) => pendingOperations.has(id),
    refreshCart: fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    clearError: () => setError(null),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
