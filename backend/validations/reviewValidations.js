import { body, param } from "express-validator";

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

export const reviewUuidParam = [
  param("uuid").isUUID(4).withMessage("Review UUID must be a valid UUID v4"),
];

export const productUuidParamForReviews = [
  param("productUuid")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];

export const updateReviewSchema = [
  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be a number between 0 and 5"),

  body("review").optional().isString().withMessage("Review must be a string"),
];
