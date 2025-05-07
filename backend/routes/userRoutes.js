import express from "express";
import * as userController from "../controllers/userController.js";
import * as validation from "../validations/index.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

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
// No validation to make it more flexible
router.post("/refresh-token", userController.refreshToken);

router.post(
  "/activateDeactivate",
  authenticate,
  validation.validate(validation.activateDeactivateSchema),
  userController.activateDeactivate
);

router.get(
  "/all",
  authenticate,
  isAdmin,
  validation.validate(validation.paginationSchema),
  userController.getAllUsers
);

export default router;
