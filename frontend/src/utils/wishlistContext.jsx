import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getWishlist,
  addToWishlist as addToWishlistService,
  removeFromWishlist as removeFromWishlistService,
  clearWishlist as clearWishlistService,
  isProductInWishlist as checkProductInWishlistService,
} from "./wishlistService";
import { useAuth } from "./authContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  // Function to fetch wishlist data
  const fetchWishlist = React.useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setWishlistCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getWishlist();
      if (response.success && response.data) {
        setWishlistItems(response.data.items || []);
        setWishlistCount((response.data.items || []).length);
      } else {
        setWishlistItems([]);
        setWishlistCount(0);
        if (response.message) {
          setError(response.message);
        }
      }
    } catch (error) {
      console.error("Error fetching wishlist in context:", error);
      setWishlistItems([]);
      setWishlistCount(0);
      setError("Failed to load wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update wishlist when authentication status changes
  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  // Add item to wishlist
  const addItem = async (productId, productDetails = {}) => {
    if (!isAuthenticated) return;

    addPendingItem(productId);
    setError(null);

    // Optimistic update
    const tempId = Date.now();
    const optimisticItem = {
      id: tempId,
      product_uuid: productId,
      item_uuid: `temp-${tempId}`,
      ...productDetails,
      isOptimistic: true,
    };

    setWishlistItems((prev) => [...prev, optimisticItem]);
    setWishlistCount((prev) => prev + 1);

    try {
      const response = await addToWishlistService(productId);

      if (!response.success) {
        throw new Error(response.message || "Failed to add to wishlist");
      }

      // Refresh wishlist to get the actual data
      await fetchWishlist();
    } catch (error) {
      // Revert optimistic update
      setWishlistItems((prev) =>
        prev.filter(
          (item) => !(item.isOptimistic && item.product_uuid === productId)
        )
      );
      setWishlistCount((prev) => prev - 1);
      setError(
        error.message || "Failed to add item to wishlist. Please try again."
      );
    } finally {
      removePendingItem(productId);
    }
  };

  // Remove item from wishlist
  const removeItem = async (itemUuid, productUuid) => {
    if (!isAuthenticated) return;

    const pendingId = productUuid || itemUuid;
    addPendingItem(pendingId);
    setError(null);

    // If itemUuid is not provided but productUuid is, find the item
    if (!itemUuid && productUuid) {
      const item = wishlistItems.find(
        (item) => item.product_uuid === productUuid
      );
      if (item) {
        itemUuid = item.item_uuid;
      } else {
        removePendingItem(pendingId);
        return; // Can't remove if we don't have an item UUID
      }
    }

    // Optimistic update
    const originalItems = [...wishlistItems];
    setWishlistItems((prev) =>
      prev.filter((item) => item.item_uuid !== itemUuid)
    );
    setWishlistCount((prev) => prev - 1);

    try {
      const response = await removeFromWishlistService(itemUuid);

      if (!response.success) {
        throw new Error(response.message || "Failed to remove from wishlist");
      }
    } catch (error) {
      // Revert optimistic update
      setWishlistItems(originalItems);
      setWishlistCount(originalItems.length);
      setError(
        error.message ||
          "Failed to remove item from wishlist. Please try again."
      );
    } finally {
      removePendingItem(pendingId);
    }
  };

  // Clear all items from wishlist
  const clearWishlist = async () => {
    if (!isAuthenticated) return;

    setError(null);
    const originalItems = [...wishlistItems];
    const originalCount = wishlistCount;

    // Optimistic update
    setWishlistItems([]);
    setWishlistCount(0);

    try {
      const response = await clearWishlistService();

      if (!response.success) {
        throw new Error(response.message || "Failed to clear wishlist");
      }
    } catch (error) {
      // Revert optimistic update
      setWishlistItems(originalItems);
      setWishlistCount(originalCount);
      setError(error.message || "Failed to clear wishlist. Please try again.");
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productUuid) => {
    return wishlistItems.some((item) => item.product_uuid === productUuid);
  };

  const value = {
    wishlistItems,
    wishlistCount,
    loading,
    error,
    isItemPending,
    refreshWishlist: fetchWishlist,
    addItem,
    removeItem,
    clearWishlist,
    isInWishlist,
    clearError: () => setError(null),
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
