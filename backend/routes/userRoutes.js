import express from "express";
import * as userController from "../controllers/userController.js";
import {
  validate,
  registerSchema,
  loginSchema,
} from "../middlewares/validator.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", validate(registerSchema), userController.register);
router.post("/login", validate(loginSchema), userController.login);
router.post("/refresh-token", authenticate, userController.refreshToken);

router.post(
  "/activateDeactivate",
  authenticate,
  userController.activateDeactivate,
);

export default router;
