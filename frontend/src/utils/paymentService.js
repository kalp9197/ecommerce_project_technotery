import api from "./axios";

// Create a Stripe Checkout session
export const createCheckoutSession = async (cartItems) => {
  try {
    // Make sure we only send valid data to the backend
    const preparedCartItems = cartItems.map((item) => ({
      id: item.id,
      name: item.name || "Product",
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      description: item.description || "Product description",
      image: item.image || "", // Send empty string instead of null for easier validation
      cart_id: item.cart_id,
    }));

    const response = await api.post("/payments/create-checkout-session", {
      cartItems: preparedCartItems,
    });

    if (response.data.success && response.data.url) {
      // Redirect to Stripe Checkout page
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
