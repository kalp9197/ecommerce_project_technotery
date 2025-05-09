import api from "./axios";
import { getAuthHeader } from "./productService";

// Helper to check if user is authenticated
const isUserAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Get current user's wishlist
export const getWishlist = async () => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
      data: { items: [] },
    };
  }

  try {
    const response = await api.get("/wishlist", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
        data: { items: [] },
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch wishlist",
      data: { items: [] },
    };
  }
};

// Add product to wishlist (uses product_uuid)
export const addToWishlist = async (productUuid) => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.post(
      "/wishlist",
      {
        product_uuid: productUuid,
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
      message: error.response?.data?.message || "Failed to add item to wishlist",
    };
  }
};

// Remove from wishlist (uses item_uuid)
export const removeFromWishlist = async (itemUuid) => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.delete(`/wishlist/${itemUuid}`, {
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
        error.response?.data?.message || "Failed to remove item from wishlist",
    };
  }
};

// Clear all items from wishlist
export const clearWishlist = async () => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
    };
  }

  try {
    const response = await api.delete("/wishlist/clear/all", {
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
      message: error.response?.data?.message || "Failed to clear wishlist",
    };
  }
};

// Check if product is in wishlist
export const isProductInWishlist = async (productUuid) => {
  if (!isUserAuthenticated()) {
    return {
      success: false,
      message: "Authentication required",
      requiresAuth: true,
      data: { isInWishlist: false },
    };
  }

  try {
    const response = await api.get(`/wishlist/check/${productUuid}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Authentication required",
        requiresAuth: true,
        data: { isInWishlist: false },
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "Failed to check wishlist status",
      data: { isInWishlist: false },
    };
  }
};
