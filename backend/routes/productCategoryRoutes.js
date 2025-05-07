import express from "express";
import * as categoryController from "../controllers/productCategoryController.js";
import { authenticate } from "../middlewares/auth.js";
import { isAdmin } from "../middlewares/adminAuth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

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

router.use(authenticate);

router.post(
  "/",
  isAdmin,
  validation.validate(validation.categorySchema),
  categoryController.createCategory
);
router.put(
  "/:uuid",
  isAdmin,
  validation.validate([
    ...validation.categoryUuidParam,
    ...validation.categorySchema,
  ]),
  categoryController.updateCategoryByUuid
);
router.delete(
  "/:uuid",
  isAdmin,
  validation.validate(validation.categoryUuidParam),
  categoryController.deleteCategoryByUuid
);

export default router;
