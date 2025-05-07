import { paymentService } from "../services/index.js";
import { HTTP_STATUS } from "../constants/index.js";

// Create Stripe checkout session for cart
export const createCheckoutSession = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems?.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Cart items required",
      });
    }

    const session = await paymentService.createStripeCheckoutSession(
      cartItems,
      req.user?.id
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || "Payment processing failed",
      type: err.type || "unknown_error",
    });
  }
};

// Process Stripe webhook events
export const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Signature missing",
    });
  }

  try {
    const event = paymentService.verifyStripeWebhookSignature(
      req.body,
      signature
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Order processing code would go here
    }

    res.status(HTTP_STATUS.OK).json({ received: true });
  } catch (err) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message || "Invalid payment information",
    });
  }
};
