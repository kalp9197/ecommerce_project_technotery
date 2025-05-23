import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCart,
  addToCart,
  updateCartItem as updateCartItemService,
  removeFromCart,
  clearCart as clearCartService,
  batchUpdateCartItems as batchUpdateCartItemsService,
} from "./cartService";
import { useAuth } from "./authContext";
import PropTypes from "prop-types";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0); // Total quantity of all items
  const [cartItemCount, setCartItemCount] = useState(0); // Number of distinct products
  const [cartTotal, setCartTotal] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const [pendingItems, setPendingItems] = useState(new Set());
  const { isAuthenticated } = useAuth();

  // Helper to track pending operations
  const addPendingItem = (itemUuid) => {
    setPendingItems((prev) => new Set([...prev, itemUuid]));
  };

  const removePendingItem = (itemUuid) => {
    setPendingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemUuid);
      return next;
    });
  };

  const isItemPending = (itemUuid) => {
    return pendingItems.has(itemUuid);
  };

  // Function to fetch cart data
  const fetchCart = React.useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setCartCount(0);
      setCartItemCount(0);
      setCartTotal("0.00");
      setError(null); // Clear error on auth change
      return;
    }

    setLoading(true);
    setError(null); // Clear error before fetching
    try {
      const response = await getCart();
      if (response.success && response.data) {
        const items = response.data.items || [];
        setCartItems(items);
        setCartCount(response.data.total_items || 0);
        setCartItemCount(items.length); // Number of distinct products
        setCartTotal(response.data.total_price || "0.00");
      } else {
        setCartItems([]);
        setCartCount(0);
        setCartItemCount(0);
        setCartTotal("0.00");
        setError(response.message || "Failed to fetch cart data."); // Set error
      }
    } catch (error) {
      console.error("Error fetching cart in context:", error);
      setCartItems([]);
      setCartCount(0);
      setCartItemCount(0);
      setCartTotal("0.00");
      setError(error.message || "An unexpected error occurred while fetching cart."); // Set error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update cart when authentication status changes
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, fetchCart]);

  // Add item to cart
  const addItem = async (productId, quantity = 1, productDetails = {}) => {
    if (!isAuthenticated) return;

    addPendingItem(productId);
    setError(null); // Clear error before action

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
    setCartItemCount((prev) => prev + 1); // Adding a new distinct product
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
        setCartItemCount((prev) => prev - 1); // Remove the distinct product
        setCartTotal((prev) =>
          (
            parseFloat(prev) -
            (parseFloat(productDetails.price) || 0) * quantity
          ).toFixed(2)
        );
        setError(response.message || "Failed to add item to cart."); // Set error
      }
    } catch (err) { // Changed from general catch to catch(err)
      // Revert optimistic update
      setCartItems((prev) => prev.filter((item) => item.id !== tempId));
      setCartCount((prev) => prev - quantity);
      setCartItemCount((prev) => prev - 1); // Remove the distinct product
      setCartTotal((prev) =>
        (
          parseFloat(prev) -
          (parseFloat(productDetails.price) || 0) * quantity
        ).toFixed(2)
      );
      setError(err.message || "An unexpected error occurred while adding item."); // Set error
    } finally {
      removePendingItem(productId);
    }
  };

  // Update cart item
  const updateItem = async (itemUuid, newQuantity, oldQuantity) => {
    if (!isAuthenticated || newQuantity < 1) return;

    addPendingItem(itemUuid);
    setError(null); // Clear error before action

    const item = cartItems.find((item) => item.item_uuid === itemUuid);
    if (!item) return;

    const quantityDiff = newQuantity - oldQuantity;
    const priceDiff = (parseFloat(item.price) || 0) * quantityDiff;

    // Optimistic update
    setCartItems((prev) =>
      prev.map((item) =>
        item.item_uuid === itemUuid ? { ...item, quantity: newQuantity } : item
      )
    );
    setCartCount((prev) => prev + quantityDiff);
    setCartTotal((prev) => (parseFloat(prev) + priceDiff).toFixed(2));

    try {
      const response = await updateCartItemService(itemUuid, newQuantity);
      if (!response.success) {
        // Revert optimistic update
        setCartItems((prev) =>
          prev.map((item) =>
            item.item_uuid === itemUuid
              ? { ...item, quantity: oldQuantity }
              : item
          )
        );
        setCartCount((prev) => prev - quantityDiff);
        setCartTotal((prev) => (parseFloat(prev) - priceDiff).toFixed(2));
        setError(response.message || "Failed to update item in cart."); // Set error
      }
    } catch (err) { // Changed from general catch to catch(err)
      // Revert optimistic update
      setCartItems((prev) =>
        prev.map((item) =>
          item.item_uuid === itemUuid
            ? { ...item, quantity: oldQuantity }
            : item
        )
      );
      setCartCount((prev) => prev - quantityDiff);
      setCartTotal((prev) => (parseFloat(prev) - priceDiff).toFixed(2));
      setError(err.message || "An unexpected error occurred while updating item."); // Set error
    } finally {
      removePendingItem(itemUuid);
    }
  };

  // Remove item from cart
  const removeItem = async (itemUuid) => {
    if (!isAuthenticated) return;

    addPendingItem(itemUuid);
    setError(null); // Clear error before action

    const item = cartItems.find((item) => item.item_uuid === itemUuid);
    if (!item) return;

    const itemTotal = (parseFloat(item.price) || 0) * item.quantity;

    // Optimistic update
    setCartItems((prev) => prev.filter((item) => item.item_uuid !== itemUuid));
    setCartCount((prev) => prev - item.quantity);
    setCartItemCount((prev) => prev - 1); // Remove one distinct product
    setCartTotal((prev) => (parseFloat(prev) - itemTotal).toFixed(2));

    try {
      const response = await removeFromCart(itemUuid);
      if (!response.success) {
        // Revert optimistic update
        setCartItems((prev) => [...prev, item]);
        setCartCount((prev) => prev + item.quantity);
        setCartItemCount((prev) => prev + 1); // Add back the distinct product
        setCartTotal((prev) => (parseFloat(prev) + itemTotal).toFixed(2));
        setError(response.message || "Failed to remove item from cart."); // Set error
      }
    } catch (err) { // Changed from general catch to catch(err)
      // Revert optimistic update
      setCartItems((prev) => [...prev, item]);
      setCartCount((prev) => prev + item.quantity);
      setCartItemCount((prev) => prev + 1); // Add back the distinct product
      setCartTotal((prev) => (parseFloat(prev) + itemTotal).toFixed(2));
      setError(err.message || "An unexpected error occurred while removing item."); // Set error
    } finally {
      removePendingItem(itemUuid);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) return;
    setError(null); // Clear error before action

    const previousItems = [...cartItems];
    const previousCount = cartCount;
    const previousItemCount = cartItemCount;
    const previousTotal = cartTotal;

    // Optimistic update
    setCartItems([]);
    setCartCount(0);
    setCartItemCount(0);
    setCartTotal("0.00");

    try {
      const response = await clearCartService();
      if (!response.success) {
        // Revert optimistic update
        setCartItems(previousItems);
        setCartCount(previousCount);
        setCartItemCount(previousItemCount);
        setCartTotal(previousTotal);
        setError(response.message || "Failed to clear cart."); // Set error
      }
    } catch (err) { // Changed from general catch to catch(err)
      // Revert optimistic update
      setCartItems(previousItems);
      setCartCount(previousCount);
      setCartItemCount(previousItemCount);
      setCartTotal(previousTotal);
      setError(err.message || "An unexpected error occurred while clearing cart."); // Set error
    }
  };

  // Batch update cart items
  const batchUpdateItems = async (updatedItems) => {
    if (!isAuthenticated || !updatedItems.length) return;
    setError(null); // Clear error before action

    // Mark all items as pending
    updatedItems.forEach((item) => addPendingItem(item.item_uuid));

    // Store original state for potential rollback
    const originalItems = [...cartItems];
    const originalCount = cartCount;
    const originalItemCount = cartItemCount;
    const originalTotal = cartTotal;

    // Calculate new quantities and totals
    let newCount = 0;
    let newTotal = 0;

    // Create a map of updated items for quick lookup
    const updatedItemsMap = {};
    updatedItems.forEach((item) => {
      updatedItemsMap[item.item_uuid] = item.quantity;
    });

    // Update cart items with new quantities
    const updatedCartItems = cartItems.map((item) => {
      if (updatedItemsMap[item.item_uuid] !== undefined) {
        const newQuantity = updatedItemsMap[item.item_uuid];
        const itemTotal = parseFloat(item.price) * newQuantity;
        newCount += newQuantity;
        newTotal += itemTotal;
        return { ...item, quantity: newQuantity };
      } else {
        newCount += item.quantity;
        newTotal += parseFloat(item.price) * item.quantity;
        return item;
      }
    });

    // Optimistic update
    setCartItems(updatedCartItems);
    setCartCount(newCount);
    setCartItemCount(updatedCartItems.length); // Number of distinct products
    setCartTotal(newTotal.toFixed(2));

    try {
      const response = await batchUpdateCartItemsService(updatedItems);
      if (!response.success) {
        // Revert optimistic update
        setCartItems(originalItems);
        setCartCount(originalCount);
        setCartItemCount(originalItemCount);
        setCartTotal(originalTotal);
        setError(response.message || "Failed to update items in cart."); // Set error
      } else {
        // Refresh cart to get server state
        await fetchCart();
      }
    } catch (err) { // Changed from general catch to catch(err)
      // Revert optimistic update
      setCartItems(originalItems);
      setCartCount(originalCount);
      setCartItemCount(originalItemCount);
      setCartTotal(originalTotal);
      setError(err.message || "An unexpected error occurred while updating items."); // Set error
    } finally {
      // Remove all items from pending state
      updatedItems.forEach((item) => removePendingItem(item.item_uuid));
    }
  };

  // Function to clear error state
  const clearError = () => {
    setError(null);
  };

  const value = {
    cartItems,
    cartCount,
    cartItemCount,
    cartTotal,
    loading,
    error, // Add error state to context
    clearError, // Add clearError function to context
    isItemPending,
    refreshCart: fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    batchUpdateItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
