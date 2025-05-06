import express from "express";
import * as categoryController from "../controllers/productCategoryController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import {
  validate,
  categorySchema,
  categoryUuidParam,
  paginationSchema,
} from "../validations/index.js";

const router = express.Router();

// Public category routes (no authentication required)
router.get(
  "/",
  validate(paginationSchema),
  categoryController.getAllCategories
);
router.get(
  "/:uuid",
  validate(categoryUuidParam),
  categoryController.getCategoryByUuid
);

// Protected routes (authentication required)
// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Admin-only routes for category modifications
router.post(
  "/",
  authenticate,
  isAdmin,
  validate(categorySchema),
  categoryController.createCategory
);
router.put(
  "/:uuid",
  authenticate,
  isAdmin,
  validate([...categoryUuidParam, ...categorySchema]),
  categoryController.updateCategoryByUuid
);
router.delete(
  "/:uuid",
  authenticate,
  isAdmin,
  validate(categoryUuidParam),
  categoryController.deleteCategoryByUuid
);

export default router;
