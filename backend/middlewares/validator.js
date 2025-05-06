import { validationResult, body, param, query } from "express-validator";
import path from "path";

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

// Enhanced user validation schemas
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

export const refreshTokenSchema = [
  body("refresh_token")
    .optional()
    .isString()
    .withMessage("Refresh token must be a string"),

  body("token").optional().isString().withMessage("Token must be a string"),
];

export const userUuidParam = [
  param("uuid").isUUID(4).withMessage("User UUID must be a valid UUID v4"),
];

// Payment validation schemas
export const checkoutSessionSchema = [
  body("cartItems")
    .isArray()
    .withMessage("Cart items must be an array")
    .notEmpty()
    .withMessage("Cart items cannot be empty"),
  body("cartItems.*.name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required for each item")
    .isString()
    .withMessage("Product name must be a string"),
  body("cartItems.*.price")
    .notEmpty()
    .withMessage("Price is required for each item")
    .customSanitizer((value) => {
      const price = parseFloat(value);
      return isNaN(price) ? 0 : price;
    })
    .custom((value) => {
      if (value <= 0) {
        throw new Error("Price must be greater than 0");
      }
      return true;
    }),
  body("cartItems.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required for each item")
    .customSanitizer((value) => {
      const quantity = parseInt(value);
      return isNaN(quantity) ? 1 : quantity;
    })
    .custom((value) => {
      if (value < 1) {
        throw new Error("Quantity must be at least 1");
      }
      return true;
    }),
  body("cartItems.*.cart_id")
    .optional()
    .isString()
    .withMessage("Cart ID must be a string if provided"),
  body("cartItems.*.product_id")
    .optional()
    .isString()
    .withMessage("Product ID must be a string if provided"),
  body("cartItems.*.image")
    .optional()
    .isString()
    .withMessage("Image must be a string if provided"),
  body("cartItems.*.description")
    .optional()
    .isString()
    .withMessage("Description must be a string if provided"),
];

// Enhanced user management validation schemas
export const activateDeactivateSchema = [
  body("status").isBoolean().withMessage("Status must be a boolean value"),
  body("reason")
    .optional()
    .isString()
    .withMessage("Reason must be a string")
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

// Common pagination validation schema
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

export const verifyEmailSchema = [
  param("token")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required")
    .isLength({ min: 32, max: 64 })
    .withMessage("Invalid verification token format"),
];

export const resendVerificationEmailSchema = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

// Enhance search validation with more specific rules
export const searchProductsSchema = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search query must be a string")
    .trim(),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number")
    .toFloat(),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number")
    .toFloat(),
  query("orderBy")
    .optional()
    .isIn(["name", "price", "created_at"])
    .withMessage("Order by must be one of: name, price, created_at"),
  query("orderDir")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order direction must be either asc or desc"),
  ...paginationSchema,
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
  body("p_cat_uuid")
    .notEmpty()
    .withMessage("Category ID is required")
    .isUUID(4)
    .withMessage("Category ID must be a valid UUID v4"),

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

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt()
    .withMessage("Quantity must be an integer")
    .custom((value) => value >= 0)
    .withMessage("Quantity cannot be negative")
    .toInt(),
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

// Product review validation schemas
export const productReviewSchema = [
  body("product_uuid")
    .notEmpty()
    .withMessage("Product UUID is required")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be a number between 0 and 5"),

  body("review").optional().isString().withMessage("Review must be a string"),
];

export const reviewUuidParam = [
  param("uuid").isUUID(4).withMessage("Review UUID must be a valid UUID v4"),
];

export const productUuidParamForReviews = [
  param("productUuid")
    .isUUID(4)
    .withMessage("Product UUID must be a valid UUID v4"),
];

export const updateReviewSchema = [
  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be a number between 0 and 5"),

  body("review").optional().isString().withMessage("Review must be a string"),
];

// Webhook validation schema
export const webhookSchema = [
  body().custom((value, { req }) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      throw new Error("Stripe signature is required");
    }
    return true;
  }),
];

// Email test validation schema
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

// File upload validation schema
export const fileUploadSchema = [
  body().custom((value, { req }) => {
    if (!req.files) {
      throw new Error("No files were uploaded");
    }

    // Check if files are provided with the correct keys
    if (!req.files.csv && !req.files.zip) {
      // Try to find CSV and ZIP files in the request
      const fileKeys = Object.keys(req.files);
      let csvFound = false;
      let zipFound = false;

      for (const key of fileKeys) {
        if (Array.isArray(req.files[key])) {
          for (const file of req.files[key]) {
            if (file.name.toLowerCase().endsWith(".csv")) csvFound = true;
            if (file.name.toLowerCase().endsWith(".zip")) zipFound = true;
          }
        } else {
          const file = req.files[key];
          if (file.name.toLowerCase().endsWith(".csv")) csvFound = true;
          if (file.name.toLowerCase().endsWith(".zip")) zipFound = true;
        }
      }

      if (!csvFound || !zipFound) {
        throw new Error("Both CSV and ZIP files are required");
      }
    } else {
      // Check if both CSV and ZIP files exist
      if (!req.files.csv || !req.files.zip) {
        throw new Error("Both CSV and ZIP files are required");
      }
    }

    // Check if file names match
    const csvFile = req.files.csv;
    const zipFile = req.files.zip;
    const csvBaseName = path.parse(csvFile.name).name;
    const zipBaseName = path.parse(zipFile.name).name;

    if (csvBaseName !== zipBaseName) {
      throw new Error(
        `File base names must match: ${csvFile.name} vs ${zipFile.name}`
      );
    }

    return true;
  }),
];
