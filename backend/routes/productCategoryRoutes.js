import express from "express";
import * as categoryController from "../controllers/productCategoryController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

// Public category routes (no authentication required)
router.get(
  "/",
  validation.validate(validation.paginationSchema),
  categoryController.getAllCategories
);
router.get(
  "/:uuid",
  validation.validate(validation.categoryUuidParam),
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
  validation.validate(validation.categorySchema),
  categoryController.createCategory
);
router.put(
  "/:uuid",
  authenticate,
  isAdmin,
  validation.validate([
    ...validation.categoryUuidParam,
    ...validation.categorySchema,
  ]),
  categoryController.updateCategoryByUuid
);
router.delete(
  "/:uuid",
  authenticate,
  isAdmin,
  validation.validate(validation.categoryUuidParam),
  categoryController.deleteCategoryByUuid
);

export default router;
