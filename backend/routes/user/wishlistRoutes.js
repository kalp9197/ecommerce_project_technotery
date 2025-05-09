import express from "express";
import { wishlistController } from "../../controllers/user/index.js";
import { authenticate } from "../../middlewares/auth.js";
import { isNotAdmin } from "../../middlewares/adminAuth.js";
import * as validation from "../../validations/index.js";

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
  "/:productUuid",
  validation.validate(validation.wishlistProductUuidParam),
  wishlistController.removeFromWishlist
);

// Clear entire wishlist
router.delete("/clear/all", wishlistController.clearWishlist);

export default router;
