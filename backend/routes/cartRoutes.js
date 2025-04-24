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
} from "../middlewares/validator.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get("/", cartController.getUserCart);

// Add item to cart
router.post("/items", validate(addToCartSchema), cartController.addItemToCart);

// Batch update cart items
router.put(
  "/items/batch",
  validate(batchUpdateCartItemsSchema),
  cartController.batchUpdateCartItems
);

// Update cart item quantity
router.put(
  "/items/:uuid",
  validate(updateCartItemSchema),
  cartController.updateCartItem
);

// Remove item from cart
router.delete(
  "/items/deactivate/:uuid",
  validate(deactivateCartItemSchema),
  cartController.deactivateCartItem
);

// Clear cart (deactivate all items)
router.delete(
  "/items/deactivateAll",
  validate(deactivateAllCartItemsSchema),
  cartController.deactivateAllCartItems
);

// Complete order and deactivate cart
router.post(
  "/complete-order",
  validate(completeOrderSchema),
  cartController.completeOrder
);

export default router;
