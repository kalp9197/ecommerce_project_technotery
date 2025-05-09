import { HTTP_STATUS } from "../../constants/index.js";
import { wishlistModel } from "../../models/user/index.js";

// Get user's wishlist
export const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await wishlistModel.getWishlistItems(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get wishlist: ${error.message}`,
    });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productUuid } = req.body;

    const result = await wishlistModel.addToWishlist(userId, productUuid);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product added to wishlist successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.includes("Product not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to add product to wishlist: ${error.message}`,
    });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productUuid } = req.params;

    const result = await wishlistModel.removeFromWishlist(userId, productUuid);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product removed from wishlist successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to remove product from wishlist: ${error.message}`,
    });
  }
};

// Clear entire wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await wishlistModel.clearWishlist(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to clear wishlist: ${error.message}`,
    });
  }
};
