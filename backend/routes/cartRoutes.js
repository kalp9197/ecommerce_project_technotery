import express from "express";
import { authenticate } from "../middlewares/auth.js";
import * as cartController from "../controllers/cartController.js";
import { isAdmin } from "../middlewares/adminAuth.js";

import {
  validate,
  addToCartSchema,
  updateCartItemSchema,
  deactivateCartItemSchema,
} from "../middlewares/validator.js";

const router = express.Router();

// All cart operations require authentication
router.use(authenticate);

// Regular user cart routes - users can only manage their own carts
router.get("/", cartController.getUserCart);
router.post("/items", validate(addToCartSchema), cartController.addItemToCart);
router.put(
  "/items/:id",
  validate(updateCartItemSchema),
  cartController.updateCartItem
);
router.delete(
  "/items/deactivate/:id",
  validate(deactivateCartItemSchema),
  cartController.deactivateCartItem
);
router.delete("/items/deactivateAll", cartController.deactivateAllCartItems);

// Admin routes
router.get("/all", authenticate, isAdmin, cartController.getAllCarts);

export default router;
