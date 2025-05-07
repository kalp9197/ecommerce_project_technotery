import express from "express";
import {
  handleWebhook,
  createCheckoutSession,
} from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/auth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

router.post(
  "/create-checkout-session",
  authenticate,
  validation.validate(validation.checkoutSessionSchema),
  createCheckoutSession
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  validation.validate(validation.webhookSchema),
  handleWebhook
);

export default router;
