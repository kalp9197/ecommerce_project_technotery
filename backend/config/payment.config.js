import Stripe from "stripe";
import { PAYMENT_CONFIG } from "../constants/index.js";

// Stripe payment gateway configuration settings
const stripeConfig = {
  secretKey: PAYMENT_CONFIG.STRIPE_SECRET_KEY,
  webhookSecret: PAYMENT_CONFIG.STRIPE_WEBHOOK_SECRET,
  currency: PAYMENT_CONFIG.CURRENCY,
};

// Initialize Stripe client with API key
const stripe = new Stripe(stripeConfig.secretKey);

export { stripeConfig, stripe };
