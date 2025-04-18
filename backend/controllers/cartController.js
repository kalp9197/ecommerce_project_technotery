import * as cartModel from "../models/cartModel.js";
import { query } from "../utils/db.js";

// Get user's active cart with all items
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartData = await cartModel.getCartItems(userId);

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: cartData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving cart",
    });
  }
};

// Add product to cart (creates cart if needed)
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_uuid, quantity = 1 } = req.body;

    const item = await cartModel.addToCart(userId, product_uuid, quantity);
    const cartData = await cartModel.getCartItems(userId);

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        item,
        ...cartData,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Error adding item to cart",
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    const item = await cartModel.updateCartItem(userId, itemId, quantity);
    const cartData = await cartModel.getCartItems(userId);

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: {
        item,
        ...cartData,
      },
    });
  } catch (error) {
    const code = error.message.includes("not found") ? 404 : 500;
    res.status(code).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove item from cart (soft delete)
export const deactivateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    await cartModel.deactivateCartItem(userId, itemId);
    const cartData = await cartModel.getCartItems(userId);

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: cartData,
    });
  } catch (error) {
    const code = error.message.includes("not found") ? 404 : 500;
    res.status(code).json({
      success: false,
      message: error.message,
    });
  }
};

// Empty cart by removing all items
export const deactivateAllCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    await cartModel.deactivateAllCartItems(userId);

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        total_items: 0,
        total_price: "0.00",
        items: [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error clearing cart",
    });
  }
};

// // Helper function to update cart totals
// const updateCartTotals = async (cartId) => {
//   try {
//     // Get total items and price
//     const totals = await query(
//       `SELECT
//         COUNT(*) as total_items,
//         SUM(price) as total_price
//       FROM cart_items
//       WHERE cart_id = ? AND is_active = 1`,
//       [cartId]
//     );

//     // Update cart with new totals
//     await query(
//       "UPDATE cart SET total_items = ?, total_price = ? WHERE id = ?",
//       [totals[0].total_items || 0, totals[0].total_price || 0, cartId]
//     );

//     return true;
//   } catch (error) {
//     throw new Error(`Failed to update cart totals: ${error.message}`);
//   }
// };

// Get all carts (admin only)
export const getAllCarts = async (req, res) => {
  try {
    const carts = await cartModel.getAllCarts();

    res.status(200).json({
      success: true,
      message: "All carts retrieved successfully",
      data: carts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving all carts",
    });
  }
};

// Get user's cart by admin using uuid (admin only)

export const getUserCartByAdmin = async (req, res) => {
  try {
    const userUuid = req.params.uuid;

    const cartData = await cartModel.getUserCartByAdmin(userUuid);

    res.status(200).json({
      success: true,
      message: "User cart retrieved successfully",
      data: cartData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving user cart",
    });
  }
};
