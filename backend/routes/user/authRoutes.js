import express from "express";
import * as validation from "../../validations/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { authController } from "../../controllers/user/index.js";

const router = express.Router();

// Public routes - authentication
router.post(
  "/register",
  validation.validate(validation.registerSchema),
  authController.register
);
router.post(
  "/login",
  validation.validate(validation.loginSchema),
  authController.login
);
router.get(
  "/verify-email/:token",
  validation.validate(validation.verifyEmailSchema),
  authController.verifyEmail
);
router.post(
  "/resend-verification",
  validation.validate(validation.resendVerificationEmailSchema),
  authController.resendVerificationEmail
);
router.post("/refresh-token", authController.refreshToken);

// Protected routes - user account management
router.post(
  "/activateDeactivate",
  authenticate,
  validation.validate(validation.activateDeactivateSchema),
  authController.activateDeactivate
);

export default router;
