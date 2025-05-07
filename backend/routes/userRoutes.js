import express from "express";
import * as userController from "../controllers/userController.js";
import * as validation from "../validations/index.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

// Public routes - authentication
router.post(
  "/register",
  validation.validate(validation.registerSchema),
  userController.register
);
router.post(
  "/login",
  validation.validate(validation.loginSchema),
  userController.login
);
router.get(
  "/verify-email/:token",
  validation.validate(validation.verifyEmailSchema),
  userController.verifyEmail
);
router.post(
  "/resend-verification",
  validation.validate(validation.resendVerificationEmailSchema),
  userController.resendVerificationEmail
);
router.post("/refresh-token", userController.refreshToken);

// Protected routes - user account management
router.post(
  "/activateDeactivate",
  authenticate,
  validation.validate(validation.activateDeactivateSchema),
  userController.activateDeactivate
);

// Admin-only routes
router.get(
  "/all",
  authenticate,
  isAdmin,
  validation.validate(validation.paginationSchema),
  userController.getAllUsers
);

export default router;
