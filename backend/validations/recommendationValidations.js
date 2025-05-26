import { param } from "express-validator";

// UUID parameter validation for user ID
export const validateUuidParam = [
  param("uuid")
    .isUUID(4)
    .withMessage("uuid must be a valid UUID v4"),
];
