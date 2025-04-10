import { validationResult, body, param } from "express-validator";

// Validation middleware
export const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      success: false,
      errors: errors.array(),
    });
  };
};

// User validation schemas
export const registerSchema = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const loginSchema = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password").trim().notEmpty().withMessage("Password is required"),
];

export const userUuidParam = [
  param("uuid").isUUID(4).withMessage("User UUID must be a valid UUID v4"),
];

export const activateDeactivateSchema = [
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be a boolean value"),
];

// Product category validation schemas
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

export const categoryUuidParam = [
  param("uuid").isUUID(4).withMessage("Category UUID must be a valid UUID v4"),
];

// Product validation schemas
export const productSchema = [
  body("p_cat_uuid").notEmpty().withMessage("Category ID is required"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),

  body("description").optional().trim(),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((value) => value >= 0)
    .withMessage("Price cannot be negative"),
];

export const productUuidParam = [
  param("uuid").isUUID(4).withMessage("Product UUID must be a valid UUID v4"),
];

// Product image validation schemas
export const productImageSchema = [
  body("image_url")
    .trim()
    .notEmpty()
    .withMessage("Image url is required")
    .custom((value) => {
      // Accept either URL or base64 data
      return (
        value.startsWith("http") ||
        value.startsWith("https") ||
        value.startsWith("/") ||
        value.startsWith("data:image/")
      );
    })
    .withMessage("Invalid image format. Must be a URL or base64 encoded image"),

  body("is_featured")
    .optional()
    .isBoolean()
    .withMessage("is_featured must be a boolean value"),
];

export const productUuidParamForImage = [
  param("productUuid")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];

export const imageUuidParam = [
  param("uuid").isUUID(4).withMessage("Image UUID must be a valid UUID v4"),
];

export const imageUpdateSchema = [
  body("is_featured")
    .optional()
    .isBoolean()
    .withMessage("is_featured must be a boolean value"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean value"),

  body("image_url")
    .optional()
    .custom((value) => {
      // Accept either URL or base64 data
      return (
        value.startsWith("http") ||
        value.startsWith("https") ||
        value.startsWith("/") ||
        value.startsWith("data:image/")
      );
    })
    .withMessage("Invalid image format. Must be a URL or base64 encoded image"),
];
