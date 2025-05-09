import express from "express";
import { reviewController } from "../../controllers/user/index.js";
import { authenticate } from "../../middlewares/auth.js";
import * as validation from "../../validations/index.js";

const router = express.Router();

// Public routes
router.get(
  "/product/:productUuid",
  validation.validate(validation.productUuidParamForReviews),
  reviewController.getProductReviews
);

// Protected routes
router.use(authenticate);

router.post(
  "/",
  validation.validate(validation.productReviewSchema),
  reviewController.addReview
);

router.put(
  "/:uuid",
  validation.validate([
    ...validation.reviewUuidParam,
    ...validation.updateReviewSchema,
  ]),
  reviewController.updateReview
);

router.delete(
  "/:uuid",
  validation.validate(validation.reviewUuidParam),
  reviewController.deleteReview
);

export default router;
