import { body, param } from "express-validator";

// Product category validation schema
export const categorySchema = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean value"),
];

// Category UUID parameter validation
export const categoryUuidParam = [
  param("uuid").isUUID(4).withMessage("Category UUID must be a valid UUID v4"),
];
