import api from "./axios";
import { getAuthHeader } from "./productService";

// Helper to check if user is authenticated
const isUserAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Get current user's cart
export const getCart = async () => {
  // Don't even attempt the request if not authenticated
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
      data: [],
    };
  }

  try {
    const response = await api.get("/cart", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    // Only log detailed errors if it's not a 401
    if (error.response?.status !== 401) {
      console.error("Error fetching cart:", error);
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
        data: [],
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch cart",
      data: [],
    };
  }
};

// Add item to cart
export const addToCart = async (productId, quantity = 1, productDetails = {}) => {
  // Don't attempt the request if not authenticated
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.post(
      "/cart/items",
      { 
        product_id: productId, 
        quantity,
        name: productDetails.name,
        price: productDetails.price,
        category_name: productDetails.category_name,
        image: productDetails.image
      },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    // Only log detailed errors if it's not a 401
    if (error.response?.status !== 401) {
      console.error("Error adding item to cart:", error);
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add item to cart",
    };
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  // Don't attempt the request if not authenticated
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.put(
      `/cart/items/${itemId}`,
      { quantity },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    // Only log detailed errors if it's not a 401
    if (error.response?.status !== 401) {
      console.error("Error updating cart item:", error);
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update cart item",
    };
  }
};

// Remove item from cart
export const removeFromCart = async (itemId) => {
  // Don't attempt the request if not authenticated
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.delete(`/cart/items/${itemId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    // Only log detailed errors if it's not a 401
    if (error.response?.status !== 401) {
      console.error("Error removing item from cart:", error);
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
      };
    }
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to remove item from cart",
    };
  }
};

// Clear entire cart
export const clearCart = async () => {
  // Don't attempt the request if not authenticated
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.delete("/cart", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    // Only log detailed errors if it's not a 401
    if (error.response?.status !== 401) {
      console.error("Error clearing cart:", error);
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to clear cart",
    };
  }
};
