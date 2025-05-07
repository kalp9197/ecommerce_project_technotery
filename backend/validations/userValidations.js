import { body, param } from "express-validator";

// User registration validation rules
export const registerSchema = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    ),

  body("is_admin")
    .optional()
    .isIn([0, 1, true, false])
    .withMessage("is_admin must be 0, 1, true, or false")
    .toInt(),
];

// Login credentials validation
export const loginSchema = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").trim().notEmpty().withMessage("Password is required"),
];

// Token refresh validation
export const refreshTokenSchema = [
  body("refresh_token")
    .optional()
    .isString()
    .withMessage("Refresh token must be a string"),

  body("token").optional().isString().withMessage("Token must be a string"),
];

// User ID parameter validation
export const userUuidParam = [
  param("uuid").isUUID(4).withMessage("User UUID must be a valid UUID v4"),
];

// Account activation/deactivation validation
export const activateDeactivateSchema = [
  body("status").isBoolean().withMessage("Status must be a boolean value"),
  body("reason")
    .optional()
    .isString()
    .withMessage("Reason must be a string")
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

// Email verification token validation
export const verifyEmailSchema = [
  param("token")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required")
    .isLength({ min: 32, max: 64 })
    .withMessage("Invalid verification token format"),
];

// Email resend verification validation
export const resendVerificationEmailSchema = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];
