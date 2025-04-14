import express from "express";
import * as categoryController from "../controllers/productCategoryController.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validate,
  categorySchema,
  categoryUuidParam,
} from "../middlewares/validator.js";

const router = express.Router();

// Public category routes (no authentication required)
router.get("/", categoryController.getAllCategories);
router.get(
  "/:uuid",
  validate(categoryUuidParam),
  categoryController.getCategoryByUuid
);

// Protected routes (authentication required)
// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Category modification routes
router.post("/", validate(categorySchema), categoryController.createCategory);
router.put(
  "/:uuid",
  validate([...categoryUuidParam, ...categorySchema]),
  categoryController.updateCategoryByUuid
);
router.delete(
  "/:uuid",
  validate(categoryUuidParam),
  categoryController.deleteCategoryByUuid
);

export default router;
