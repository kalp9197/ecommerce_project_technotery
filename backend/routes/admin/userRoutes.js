import express from "express";
import { userController } from "../../controllers/admin/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/adminAuth.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Get all users
router.get(
  "/all",
  validation.validate(validation.paginationSchema),
  userController.getAllUsers
);

export default router;
