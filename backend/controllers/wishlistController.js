import * as wishlistModel from "../models/wishlistModel.js";
import { HTTP_STATUS } from "../constants/index.js";

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
      message: error.message || "Internal server error",
    });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid } = req.body;

    const result = await wishlistModel.addToWishlist(userId, product_uuid);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Product added to wishlist successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.includes("already in wishlist")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    await wishlistModel.removeFromWishlist(userId, uuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product removed from wishlist successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
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
        message: error.message,
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Check if product is in wishlist
export const checkProductInWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid } = req.params;

    const isInWishlist = await wishlistModel.isProductInWishlist(userId, product_uuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { isInWishlist },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
