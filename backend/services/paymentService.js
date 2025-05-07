import { stripe, stripeConfig } from '../config/payment.config.js';
import { appConfig } from '../config/app.config.js';

// Create a checkout session
export const createStripeCheckoutSession = async (cartItems, userId) => {
  try {
    // Helper function to validate URL
    const isValidHttpUrl = (string) => {
      try {
        if (!string) return false;
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    };

    // Format line items for Stripe
    const lineItems = cartItems.map((item) => {
      // Only include images if they're valid URLs
      const images = [];
      if (item.image && isValidHttpUrl(item.image)) {
        images.push(item.image);
      }

      // Ensure price is a valid number
      let price = 0;
      try {
        price = parseFloat(item.price) || 0;
      } catch {
        // Skip invalid prices
      }

      return {
        price_data: {
          currency: stripeConfig.currency,
          product_data: {
            name: item.name || "Product",
            description: item.description || "Product description",
            images: images,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: parseInt(item.quantity) || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${appConfig.frontendUrl}/?payment_success=true`,
      cancel_url: `${appConfig.frontendUrl}/cart`,
      metadata: {
        cartId: cartItems[0]?.cart_id || "",
        userId: userId || "",
      },
    });

    return {
      success: true,
      url: session.url,
      sessionId: session.id
    };
  } catch (error) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

// Verify Stripe webhook signature
export const verifyStripeWebhookSignature = (payload, signature) => {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
};
