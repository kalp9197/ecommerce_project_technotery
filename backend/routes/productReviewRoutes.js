import express from "express";
import * as productReviewController from "../controllers/productReviewController.js";
import { authenticate } from "../middlewares/auth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

// Public routes (no authentication required)
router.get(
  "/product/:productUuid",
  validation.validate([
    ...validation.productUuidParamForReviews,
    ...validation.paginationSchema,
  ]),
  productReviewController.getReviewsByProductUuid
);

router.get(
  "/:uuid",
  validation.validate(validation.reviewUuidParam),
  productReviewController.getReviewByUuid
);

// Protected routes (authentication required)
router.use(authenticate);

router.post(
  "/",
  validation.validate(validation.productReviewSchema),
  productReviewController.createReview
);

router.put(
  "/:uuid",
  validation.validate([
    ...validation.reviewUuidParam,
    ...validation.updateReviewSchema,
  ]),
  productReviewController.updateReview
);

router.delete(
  "/:uuid",
  validation.validate(validation.reviewUuidParam),
  productReviewController.deleteReview
);

export default router;
