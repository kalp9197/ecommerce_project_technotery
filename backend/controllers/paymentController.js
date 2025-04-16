import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Create a Checkout Session for Stripe Checkout
export const createCheckoutSession = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Cart items required" });
    }

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
          currency: "inr",
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

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${frontendUrl}/?payment_success=true`,
      cancel_url: `${frontendUrl}/cart`,
      metadata: {
        cartId: cartItems[0]?.cart_id || "",
        userId: req.user?.id || "",
      },
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);

    res.status(500).json({
      success: false,
      message: err.message,
      type: err.type || "unknown_error",
    });
  }
};

// Handle successful payment webhook
export const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res
      .status(400)
      .json({ success: false, message: "Signature missing" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Order processing code would go here
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};
