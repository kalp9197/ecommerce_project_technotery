import express from "express";
import { authenticate } from "../middlewares/auth.js";
import * as cartController from "../controllers/cartController.js";
import { isNotAdmin } from "../middlewares/adminAuth.js";

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
router.get("/", isNotAdmin, cartController.getUserCart);
router.post(
  "/items",
  isNotAdmin,
  validate(addToCartSchema),
  cartController.addItemToCart
);
router.put(
  "/items/:id",
  isNotAdmin,
  validate(updateCartItemSchema),
  cartController.updateCartItem
);
router.delete(
  "/items/deactivate/:id",
  isNotAdmin,
  validate(deactivateCartItemSchema),
  cartController.deactivateCartItem
);
router.delete(
  "/items/deactivateAll",
  isNotAdmin,
  cartController.deactivateAllCartItems
);

export default router;
