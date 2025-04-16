import express from "express";
import {
  handleWebhook,
  createCheckoutSession,
} from "../controllers/paymentController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create-checkout-session", authenticate, createCheckoutSession);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

export default router;
