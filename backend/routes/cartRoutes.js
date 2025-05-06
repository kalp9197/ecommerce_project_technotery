import express from "express";
import * as cartController from "../controllers/cartController.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validate,
  addToCartSchema,
  updateCartItemSchema,
  deactivateCartItemSchema,
  deactivateAllCartItemsSchema,
  batchUpdateCartItemsSchema,
  completeOrderSchema,
} from "../validations/index.js";
import { isNotAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get("/", isNotAdmin, cartController.getUserCart);

// Add item to cart
router.post(
  "/items",
  validate(addToCartSchema),
  isNotAdmin,
  cartController.addItemToCart
);

// Batch update cart items
router.put(
  "/items/batch",
  validate(batchUpdateCartItemsSchema),
  isNotAdmin,
  cartController.batchUpdateCartItems
);

// Update cart item quantity
router.put(
  "/items/:uuid",
  validate(updateCartItemSchema),
  isNotAdmin,
  cartController.updateCartItem
);

// Remove item from cart
router.delete(
  "/items/deactivate/:uuid",
  validate(deactivateCartItemSchema),
  isNotAdmin,
  cartController.deactivateCartItem
);

// Clear cart (deactivate all items)
router.delete(
  "/items/deactivateAll",
  validate(deactivateAllCartItemsSchema),
  isNotAdmin,
  cartController.deactivateAllCartItems
);

// Complete order and deactivate cart
router.post(
  "/complete-order",
  validate(completeOrderSchema),
  isNotAdmin,
  cartController.completeOrder
);

export default router;
