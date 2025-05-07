import { body } from "express-validator";

export const emailTestSchema = [
  body("to")
    .trim()
    .notEmpty()
    .withMessage("Recipient email is required")
    .isEmail()
    .withMessage("Please provide a valid recipient email")
    .normalizeEmail(),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Email subject is required")
    .isString()
    .withMessage("Subject must be a string"),

  body("text")
    .trim()
    .notEmpty()
    .withMessage("Email content is required")
    .isString()
    .withMessage("Email content must be a string"),

  body("html")
    .optional()
    .isString()
    .withMessage("HTML content must be a string"),
];
