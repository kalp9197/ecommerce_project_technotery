import express from "express";
import * as productReviewController from "../controllers/productReviewController.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validate,
  productReviewSchema,
  reviewUuidParam,
  productUuidParamForReviews,
  updateReviewSchema,
  paginationSchema,
} from "../validations/index.js";

const router = express.Router();

// Public routes (no authentication required)
router.get(
  "/product/:productUuid",
  validate([...productUuidParamForReviews, ...paginationSchema]),
  productReviewController.getReviewsByProductUuid
);

router.get(
  "/:uuid",
  validate(reviewUuidParam),
  productReviewController.getReviewByUuid
);

// Protected routes (authentication required)
router.use(authenticate);

router.post(
  "/",
  validate(productReviewSchema),
  productReviewController.createReview
);

router.put(
  "/:uuid",
  validate([...reviewUuidParam, ...updateReviewSchema]),
  productReviewController.updateReview
);

router.delete(
  "/:uuid",
  validate(reviewUuidParam),
  productReviewController.deleteReview
);

export default router;
