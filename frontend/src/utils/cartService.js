import api from "./axios";
import { getAuthHeader } from "./productService";

// Helper to check if user is authenticated
const isUserAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Get current user's cart
export const getCart = async () => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
      data: { items: [], total_items: 0, total_price: "0.00" },
    };
  }

  try {
    const response = await api.get("/cart", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
        data: { items: [], total_items: 0, total_price: "0.00" },
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch cart",
      data: { items: [], total_items: 0, total_price: "0.00" },
    };
  }
};

// Add item to cart
export const addToCart = async (productId, quantity = 1) => {
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
        product_uuid: productId,
        quantity,
      },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
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
export const updateCartItem = async (productUuid, quantity) => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.put(
      `/cart/items/${productUuid}`,
      { quantity },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
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

// Deactivate cart item (instead of removing)
export const removeFromCart = async (productUuid) => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.delete(`/cart/items/deactivate/${productUuid}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
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

// Deactivate all cart items (instead of clearing)
export const clearCart = async () => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.delete(
      "/cart/items/deactivateAll",
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
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
