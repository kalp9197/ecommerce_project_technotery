import express from "express";
import { categoryController } from "../../controllers/admin/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/adminAuth.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Category management routes
router.post(
  "/",
  validation.validate(validation.categorySchema),
  categoryController.createCategory
);

router.put(
  "/:uuid",
  validation.validate([
    ...validation.categoryUuidParam,
    ...validation.categorySchema.map((val) => val.optional()),
  ]),
  categoryController.updateCategory
);

router.delete(
  "/:uuid",
  validation.validate(validation.categoryUuidParam),
  categoryController.deleteCategory
);

export default router;
