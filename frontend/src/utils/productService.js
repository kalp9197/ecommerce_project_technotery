import api from "./axios";

// Product API services
export const getProducts = async () => {
  try {
    const response = await api.get("/products");
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch products",
      data: [],
    };
  }
};

export const getProductByUuid = async (uuid) => {
  try {
    const response = await api.get(`/products/${uuid}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch product details",
      data: null,
    };
  }
};

// Category API services
export const getCategories = async () => {
  try {
    const response = await api.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch categories",
      data: [],
    };
  }
};

export const getCategoryByUuid = async (uuid) => {
  try {
    const response = await api.get(`/categories/${uuid}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching category details:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch category details",
      data: null,
    };
  }
};

// Function to get auth header for protected requests
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  // Ensure the token is valid before returning the header
  if (token) {
    // Also set it on the axios instance to ensure consistency
    if (api.defaults && api.defaults.headers) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return { Authorization: `Bearer ${token}` };
  }

  return {};
};
