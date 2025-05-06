import { body } from "express-validator";

// Checkout session validation schema
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
