import Stripe from "stripe";
import { PAYMENT_CONFIG } from "../constants/index.js";

// Stripe configuration
const stripeConfig = {
  secretKey: PAYMENT_CONFIG.STRIPE_SECRET_KEY,
  webhookSecret: PAYMENT_CONFIG.STRIPE_WEBHOOK_SECRET,
  currency: PAYMENT_CONFIG.CURRENCY,
};

// Initialize Stripe
const stripe = new Stripe(stripeConfig.secretKey);

export { stripeConfig, stripe };
