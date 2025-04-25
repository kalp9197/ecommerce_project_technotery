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

  body("is_admin")
    .optional()
    .isIn([0, 1, true, false])
    .withMessage("is_admin must be 0, 1, true, or false")
    .toInt(),
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
  body("image_path")
    .trim()
    .notEmpty()
    .withMessage("Image path is required")
    .isString()
    .withMessage("Image path must be a string"),

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
    .isString()
    .withMessage("Image path must be a string"),
];

// Cart validation schemas
export const addToCartSchema = [
  body("product_uuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),

  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
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
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
    .toInt(),
];

export const batchUpdateCartItemsSchema = [
  body()
    .isArray()
    .withMessage("Request body must be an array")
    .notEmpty()
    .withMessage("Array cannot be empty"),
  body("*.item_uuid")
    .notEmpty()
    .withMessage("item_uuid is required")
    .isUUID(4)
    .withMessage("item_uuid must be a valid UUID v4"),
  body("*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer")
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
