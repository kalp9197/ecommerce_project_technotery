import express from "express";
import * as cartController from "../controllers/cartController.js";
import { authenticate } from "../middlewares/auth.js";
import * as validation from "../validations/index.js";
import { isNotAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get("/", isNotAdmin, cartController.getUserCart);

// Add item to cart
router.post(
  "/items",
  validation.validate(validation.addToCartSchema),
  isNotAdmin,
  cartController.addItemToCart
);

// Batch update cart items
router.put(
  "/items/batch",
  validation.validate(validation.batchUpdateCartItemsSchema),
  isNotAdmin,
  cartController.batchUpdateCartItems
);

// Update cart item quantity
router.put(
  "/items/:uuid",
  validation.validate(validation.updateCartItemSchema),
  isNotAdmin,
  cartController.updateCartItem
);

// Remove item from cart
router.delete(
  "/items/deactivate/:uuid",
  validation.validate(validation.deactivateCartItemSchema),
  isNotAdmin,
  cartController.deactivateCartItem
);

// Clear cart (deactivate all items)
router.delete(
  "/items/deactivateAll",
  validation.validate(validation.deactivateAllCartItemsSchema),
  isNotAdmin,
  cartController.deactivateAllCartItems
);

// Complete order and deactivate cart
router.post(
  "/complete-order",
  validation.validate(validation.completeOrderSchema),
  isNotAdmin,
  cartController.completeOrder
);

export default router;
