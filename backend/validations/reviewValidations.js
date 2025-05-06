import { body, param } from "express-validator";

// Product review validation schema
export const productReviewSchema = [
  body("product_uuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be a number between 0 and 5"),

  body("review").optional().isString().withMessage("Review must be a string"),
];

// Review UUID parameter validation
export const reviewUuidParam = [
  param("uuid").isUUID(4).withMessage("Review UUID must be a valid UUID v4"),
];

// Product UUID parameter for reviews validation
export const productUuidParamForReviews = [
  param("productUuid")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];

// Update review validation schema
export const updateReviewSchema = [
  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be a number between 0 and 5"),

  body("review").optional().isString().withMessage("Review must be a string"),
];
