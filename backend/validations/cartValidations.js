import { body, param } from "express-validator";

export const addToCartSchema = [
  body("product_uuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),

  body("quantity")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Quantity must be between 1 and 100")
    .toInt(),
];

export const updateCartItemSchema = [
  param("uuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1, max: 100 })
    .withMessage("Quantity must be between 1 and 100")
    .toInt(),
];

export const batchUpdateCartItemsSchema = [
  body()
    .isArray()
    .withMessage("Request body must be an array")
    .notEmpty()
    .withMessage("Array cannot be empty")
    .custom((value) => value.length <= 50)
    .withMessage("Cannot update more than 50 items at once"),
  body("*.item_uuid")
    .notEmpty()
    .withMessage("item_uuid is required")
    .isUUID(4)
    .withMessage("item_uuid must be a valid UUID v4"),
  body("*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1, max: 100 })
    .withMessage("Quantity must be between 1 and 100")
    .toInt(),
];

export const deactivateCartItemSchema = [
  param("uuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];

export const deactivateAllCartItemsSchema = [];

export const completeOrderSchema = [
  body("order_completed")
    .notEmpty()
    .withMessage("order_completed status is required")
    .isBoolean()
    .withMessage("order_completed must be a boolean value"),
];
