import express from "express";
import * as cartController from "../controllers/cartController.js";
import { authenticate } from "../middlewares/auth.js";
import * as validation from "../validations/index.js";
import { isNotAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", isNotAdmin, cartController.getUserCart);

router.post(
  "/items",
  validation.validate(validation.addToCartSchema),
  isNotAdmin,
  cartController.addItemToCart
);

router.put(
  "/items/batch",
  validation.validate(validation.batchUpdateCartItemsSchema),
  isNotAdmin,
  cartController.batchUpdateCartItems
);

router.put(
  "/items/:uuid",
  validation.validate(validation.updateCartItemSchema),
  isNotAdmin,
  cartController.updateCartItem
);

router.delete(
  "/items/deactivate/:uuid",
  validation.validate(validation.deactivateCartItemSchema),
  isNotAdmin,
  cartController.deactivateCartItem
);

router.delete(
  "/items/deactivateAll",
  validation.validate(validation.deactivateAllCartItemsSchema),
  isNotAdmin,
  cartController.deactivateAllCartItems
);

router.post(
  "/complete-order",
  validation.validate(validation.completeOrderSchema),
  isNotAdmin,
  cartController.completeOrder
);

export default router;
