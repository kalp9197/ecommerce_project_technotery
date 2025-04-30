import express from "express";
import {
  handleWebhook,
  createCheckoutSession,
} from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validate,
  checkoutSessionSchema,
  webhookSchema,
} from "../middlewares/validator.js";

const router = express.Router();

router.post(
  "/create-checkout-session",
  authenticate,
  validate(checkoutSessionSchema),
  createCheckoutSession
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  validate(webhookSchema),
  handleWebhook
);

export default router;
