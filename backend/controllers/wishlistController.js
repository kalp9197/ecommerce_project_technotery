import * as wishlistModel from "../models/wishlistModel.js";
import { HTTP_STATUS } from "../constants/index.js";
import { trackEvent } from "../controllers/userAnalyticsController.js";

// Get user's wishlist
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistData = await wishlistModel.getWishlistItems(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: wishlistData,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while fetching wishlist : ${error.message}`,
    });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid } = req.body;

    const result = await wishlistModel.addToWishlist(userId, product_uuid);

    await trackEvent(userId, "add_to_wishlist", {
      productUuid: product_uuid,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Product added to wishlist successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.includes("already in wishlist")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `An error occurred while adding to wishlist : ${error.message}`,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `An error occurred while adding to wishlist : ${error.message}`,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while adding to wishlist : ${error.message}`,
    });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const wishlist = await wishlistModel.getWishlistItems(userId);
    const wishlistItem = wishlist.items.find((item) => item.item_uuid === uuid);

    const productInfo = wishlistItem
      ? {
          productUuid: wishlistItem.product_uuid
        }
      : null;

    await wishlistModel.removeFromWishlist(userId, uuid);
    if (productInfo) {
      await trackEvent(userId, "remove_from_wishlist", {
        productUuid: productInfo.productUuid
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product removed from wishlist successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `An error occurred while removing from wishlist : ${error.message}`,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while removing from wishlist : ${error.message}`,
    });
  }
};

// Clear all items from wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    await wishlistModel.clearWishlist(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `An error occurred while clearing wishlist : ${error.message}`,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while clearing wishlist : ${error.message}`,
    });
  }
};

// Check if product is in wishlist
export const checkProductInWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid } = req.params;

    const isInWishlist = await wishlistModel.isProductInWishlist(
      userId,
      product_uuid
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { isInWishlist },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while checking product in wishlist : ${error.message}`,
    });
  }
};
