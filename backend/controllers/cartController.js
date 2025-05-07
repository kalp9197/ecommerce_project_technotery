import * as cartModel from "../models/cartModel.js";
import { HTTP_STATUS } from "../constants/index.js";

// Get user's active cart with all items
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartData = await cartModel.getCartItems(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resource fetched successfully",
      data: cartData,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Add product to cart (creates cart if needed)
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid, quantity = 1 } = req.body;

    await cartModel.addToCart(userId, product_uuid, quantity);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Resource created successfully",
    });
  } catch (error) {
    // Check for insufficient stock error
    if (error.message.includes("Insufficient stock")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
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

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productUuid = req.params.uuid;
    const { quantity } = req.body;

    const item = await cartModel.updateCartItem(userId, productUuid, quantity);
    if (!item) throw new Error("Item not found or inactive");
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resource updated successfully",
    });
  } catch (error) {
    // Check for specific error types
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Resource not found",
      });
    } else if (error.message.includes("Insufficient stock")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
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

// Remove item from cart (soft delete)
export const deactivateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productUuid = req.params.uuid;

    await cartModel.deactivateCartItem(userId, productUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    const code = error.message.includes("not found")
      ? HTTP_STATUS.NOT_FOUND
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    res.status(code).json({
      success: false,
      message: error.message.includes("not found")
        ? "Resource not found"
        : "Internal server error",
    });
  }
};

// Empty cart by removing all items
export const deactivateAllCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    await cartModel.deactivateAllCartItems(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resource deleted successfully",
      data: {
        total_items: 0,
        total_price: "0.00",
        items: [],
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Batch update cart items
export const batchUpdateCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = req.body;

    const result = await cartModel.batchUpdateCartItems(userId, items);
    if (!result) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Internal server error",
      });
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resource updated successfully",
      data: {
        updated_items: result.success,
        errors: result.errors,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Complete order and deactivate current cart
export const completeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_completed } = req.body;

    if (!order_completed) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid input data",
      });
    }

    await cartModel.completeOrder(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Order completed successfully",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
