import { HTTP_STATUS } from "../../constants/index.js";
import { cartModel } from "../../models/user/index.js";
import { dbService } from "../../services/index.js";

// Get user's cart
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await cartModel.getCartItems(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cart fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get cart: ${error.message}`,
    });
  }
};

// Add item to cart
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productUuid, quantity, price } = req.body;

    // Get product ID
    const products = await dbService.query(
      `SELECT
          id
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!products?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    const productId = products[0].id;
    const result = await cartModel.addItemToCart(
      userId,
      productId,
      quantity,
      price
    );

    if (!result) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to add item to cart",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Item added to cart successfully",
    });
  } catch (error) {
    if (error.message.includes("Not enough product in stock")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to add item to cart: ${error.message}`,
    });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;
    const { quantity } = req.body;

    const result = await cartModel.updateCartItem(uuid, quantity, userId);

    if (!result) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update cart item",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cart item updated successfully",
    });
  } catch (error) {
    if (
      error.message.includes("Not enough product in stock") ||
      error.message.includes("Cart item not found") ||
      error.message.includes("Unauthorized access")
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to update cart item: ${error.message}`,
    });
  }
};

// Batch update cart items
export const batchUpdateCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid items data",
      });
    }

    const results = [];
    for (const item of items) {
      try {
        const result = await cartModel.updateCartItem(
          item.uuid,
          item.quantity,
          userId
        );
        results.push({
          uuid: item.uuid,
          success: result,
        });
      } catch (error) {
        results.push({
          uuid: item.uuid,
          success: false,
          error: error.message,
        });
      }
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cart items updated",
      data: results,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to update cart items: ${error.message}`,
    });
  }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const result = await cartModel.removeCartItem(uuid, userId);

    if (!result) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to remove cart item",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to remove cart item: ${error.message}`,
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await cartModel.deactivateAllCartItems(userId);

    if (!result) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to clear cart",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to clear cart: ${error.message}`,
    });
  }
};

// Complete order
export const completeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    const result = await cartModel.completeOrder(
      userId,
      shippingAddress,
      paymentMethod
    );

    if (!result) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to complete order",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order completed successfully",
      data: { orderUuid: result },
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to complete order: ${error.message}`,
    });
  }
};
