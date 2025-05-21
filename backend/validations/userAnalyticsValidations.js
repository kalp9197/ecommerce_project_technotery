import { query } from "express-validator";

export const getUserAnalyticsSchema = [
  query("userUuid")
    .notEmpty()
    .withMessage("User UUID is required")
    .isUUID()
    .withMessage("User UUID must be a valid UUID"),
  query("eventType")
    .optional()
    .isIn([
      "add_to_cart",
      "remove_from_cart",
      "add_to_wishlist",
      "remove_from_wishlist",
    ])
    .withMessage("Invalid event type"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
];
