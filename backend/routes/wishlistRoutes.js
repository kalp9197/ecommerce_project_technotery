import express from "express";
import * as wishlistController from "../controllers/wishlistController.js";
import { authenticate } from "../middlewares/auth.js";
import { isNotAdmin } from "../middlewares/adminAuth.js";
import * as validation from "../validations/index.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);
router.use(isNotAdmin);

// Get user's wishlist
router.get("/", wishlistController.getUserWishlist);

// Add product to wishlist
router.post(
  "/",
  validation.validate(validation.addToWishlistSchema),
  wishlistController.addToWishlist
);

// Remove product from wishlist
router.delete(
  "/:uuid",
  validation.validate(validation.wishlistItemUuidParam),
  wishlistController.removeFromWishlist
);

// Clear all items from wishlist
router.delete("/clear/all", wishlistController.clearWishlist);

// Check if product is in wishlist
router.get(
  "/check/:product_uuid",
  validation.validate(validation.wishlistProductUuidParam),
  wishlistController.checkProductInWishlist
);

export default router;
