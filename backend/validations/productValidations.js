import { body, param, query } from "express-validator";

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
];

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
