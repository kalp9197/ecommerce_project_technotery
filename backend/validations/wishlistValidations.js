import { body, param } from "express-validator";

export const addToWishlistSchema = [
  body("productUuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];

export const wishlistItemUuidParam = [
  param("uuid")
    .notEmpty()
    .withMessage("Item UUID is required")
    .isUUID(4)
    .withMessage("Item UUID must be a valid UUID v4"),
];

export const wishlistProductUuidParam = [
  param("productUuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];
