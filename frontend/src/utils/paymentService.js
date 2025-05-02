import api from "./axios";

// Create a Stripe Checkout session
export const createCheckoutSession = async (cartItems) => {
  try {
    // Make sure we only send valid data to the backend
    const preparedCartItems = cartItems.map((item) => {
      // Ensure the image URL is absolute
      let imageUrl = item.image || item.product_image;
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `${import.meta.env.VITE_API_URL}/${imageUrl}`;
      }

      return {
        name: item.name || item.product_name || "Product",
        price:
          typeof item.price === "number"
            ? item.price
            : parseFloat(item.price) || 0,
        quantity:
          typeof item.quantity === "number"
            ? item.quantity
            : parseInt(item.quantity) || 1,
        description: item.description || "",
        image: imageUrl || "",
        cart_id: item.item_uuid || "",
        product_id: item.product_uuid || item.product_id || "",
      };
    });

    const response = await api.post("/payments/create-checkout-session", {
      cartItems: preparedCartItems,
    });

    if (response.data.success && response.data.url) {
      window.location.href = response.data.url;
      return { success: true };
    }

    return response.data;
  } catch (err) {
    console.error("Error creating checkout session:", err);
    console.error("Error details:", err.response?.data);

    return {
      success: false,
      message:
        err.response?.data?.message || "Checkout failed. Please try again.",
    };
  }
};
