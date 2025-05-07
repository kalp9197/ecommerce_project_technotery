import { query, param } from "express-validator";

// Pagination parameters validation (used across multiple endpoints)
export const paginationSchema = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

// UUID parameter validation (reusable for any entity)
export const uuidParam = (paramName = "uuid") => [
  param(paramName)
    .isUUID(4)
    .withMessage(`${paramName} must be a valid UUID v4`),
];
