import express from "express";
import * as userController from "../controllers/userController.js";
import {
  validate,
  registerSchema,
  loginSchema,
  activateDeactivateSchema,
  paginationSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
} from "../validations/index.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.post("/register", validate(registerSchema), userController.register);
router.post("/login", validate(loginSchema), userController.login);
router.get(
  "/verify-email/:token",
  validate(verifyEmailSchema),
  userController.verifyEmail
);
router.post(
  "/resend-verification",
  validate(resendVerificationEmailSchema),
  userController.resendVerificationEmail
);
// No validation to make it more flexible
router.post("/refresh-token", userController.refreshToken);

router.post(
  "/activateDeactivate",
  authenticate,
  validate(activateDeactivateSchema),
  userController.activateDeactivate
);

router.get(
  "/all",
  authenticate,
  isAdmin,
  validate(paginationSchema),
  userController.getAllUsers
);

export default router;
