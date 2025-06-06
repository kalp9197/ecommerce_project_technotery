import * as cartModel from "../models/cartModel.js";
import { HTTP_STATUS } from "../constants/index.js";
import { trackEvent } from "../controllers/userAnalyticsController.js";

// Retrieve user's cart contents
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
      message: `An error occurred while fetching cart items : ${error.message}`,
    });
  }
};

// Add product to cart
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid, quantity = 1 } = req.body;

    await cartModel.addToCart(userId, product_uuid, quantity);

    await trackEvent(userId, "add_to_cart", {
      productUuid: product_uuid,
      quantity,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Resource created successfully",
    });
  } catch (error) {
    if (error.message.includes("Insufficient stock")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `An error occurred while adding item to cart : ${error.message}`,
      });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while adding item to cart : ${error.message}`,
    });
  }
};

// Modify quantity of cart item
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
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `An error occurred while updating cart item : ${error.message}`,
      });
    } else if (error.message.includes("Insufficient stock")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `An error occurred while updating cart item : ${error.message}`,
      });
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while updating cart item : ${error.message}`,
    });
  }
};

// Remove item from cart
export const deactivateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemUuid = req.params.uuid;

    const cart = await cartModel.getCartItems(userId);
    const cartItem = cart.items.find((item) => item.item_uuid === cartItemUuid);

    const productInfo = cartItem
      ? {
          productUuid: cartItem.product_uuid,
          quantity: cartItem.quantity,
        }
      : null;

    await cartModel.deactivateCartItem(userId, cartItemUuid);
    if (productInfo) {
      await trackEvent(userId, "remove_from_cart", {
        productUuid: productInfo.productUuid,
        quantity: productInfo.quantity,
      });
    }

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
      message: `An error occurred while deleting cart item : ${error.message}`,
    });
  }
};

// Clear entire cart
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
      message: `An error occurred while clearing cart : ${error.message}`,
    });
  }
};

// Update multiple cart items at once
export const batchUpdateCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = req.body;

    const result = await cartModel.batchUpdateCartItems(userId, items);
    if (!result) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid input data",
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
      message: `An error occurred while updating cart items : ${error.message}`,
    });
  }
};

// Mark order as completed after checkout
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
      message: `An error occurred while completing order : ${error.message}`,
    });
  }
};
