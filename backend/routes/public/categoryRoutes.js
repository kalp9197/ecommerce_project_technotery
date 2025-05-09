import express from "express";
import { categoryController } from "../../controllers/public/index.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// Public category routes
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

export default router;
