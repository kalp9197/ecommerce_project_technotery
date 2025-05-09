import express from "express";
import { cartController } from "../../controllers/user/index.js";
import { authenticate } from "../../middlewares/auth.js";
import * as validation from "../../validations/index.js";
import { isNotAdmin } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.use(authenticate);
router.use(isNotAdmin);

router.get("/", cartController.getUserCart);

router.post(
  "/items",
  validation.validate(validation.addToCartSchema),
  cartController.addItemToCart
);

router.put(
  "/items/:uuid",
  validation.validate(validation.updateCartItemSchema),
  cartController.updateCartItem
);

router.put(
  "/items/batch",
  validation.validate(validation.batchUpdateCartItemsSchema),
  cartController.batchUpdateCartItems
);

router.delete(
  "/items/deactivate/:uuid",
  validation.validate(validation.cartItemUuidParam),
  cartController.removeCartItem
);

router.delete("/items/deactivateAll", cartController.clearCart);

router.post(
  "/complete-order",
  validation.validate(validation.completeOrderSchema),
  cartController.completeOrder
);

export default router;
