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

// Helper function to update cart totals
const updateCartTotals = async (cartId) => {
  try {
    // Get total items and price
    const totals = await query(
      `SELECT 
        COUNT(*) as total_items,
        SUM(price) as total_price
      FROM cart_items
      WHERE cart_id = ? AND is_active = 1`,
      [cartId]
    );

    // Update cart with new totals
    await query(
      "UPDATE cart SET total_items = ?, total_price = ? WHERE id = ?",
      [totals[0].total_items || 0, totals[0].total_price || 0, cartId]
    );

    return true;
  } catch (error) {
    throw new Error(`Failed to update cart totals: ${error.message}`);
  }
};

// Admin functions to manage all carts
export const getAllCarts = async (req, res) => {
  try {
    const sql = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM cart c
      JOIN users u ON c.user_id = u.id
      WHERE c.is_active = 1
    `;

    const carts = await query(sql);

    return res.status(200).json({
      success: true,
      data: carts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch all carts: ${error.message}`,
    });
  }
};

export const getCartByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const userCheck = await query("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);
    if (!userCheck?.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's cart
    const sql = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM cart c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ? AND c.is_active = 1
    `;

    const cart = await query(sql, [userId]);
    if (!cart?.length) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user",
      });
    }

    // Get cart items
    const itemsSql = `
      SELECT ci.*, p.name as product_name, p.price as product_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ? AND ci.is_active = 1
    `;

    const cartItems = await query(itemsSql, [cart[0].id]);

    return res.status(200).json({
      success: true,
      data: {
        cart: cart[0],
        items: cartItems,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch user cart: ${error.message}`,
    });
  }
};

export const adminUpdateCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    // Validate cart item exists
    const cartItem = await query(
      "SELECT ci.*, p.name as product_name, p.price as product_price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.is_active = 1",
      [cartItemId]
    );

    if (!cartItem?.length) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Update cart item
    const newPrice = cartItem[0].product_price * quantity;
    await query(
      "UPDATE cart_items SET quantity = ?, price = ?, updated_at = NOW() WHERE id = ?",
      [quantity, newPrice, cartItemId]
    );

    // Update cart totals
    await updateCartTotals(cartItem[0].cart_id);

    // Get updated item
    const updatedItem = await query(
      "SELECT ci.*, p.name as product_name, p.price as product_price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ?",
      [cartItemId]
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: updatedItem[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to update cart item: ${error.message}`,
    });
  }
};

export const adminDeleteCartItem = async (req, res) => {
  try {
    const cartItemId = req.params.id;

    // Validate cart item exists
    const cartItem = await query(
      "SELECT ci.*, p.name as product_name FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.is_active = 1",
      [cartItemId]
    );

    if (!cartItem?.length) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const itemToDelete = cartItem[0];

    // Deactivate cart item
    await query(
      "UPDATE cart_items SET is_active = 0, updated_at = NOW() WHERE id = ?",
      [cartItemId]
    );

    // Update cart totals
    await updateCartTotals(itemToDelete.cart_id);

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
      data: {
        removed_item: {
          id: itemToDelete.id,
          product_name: itemToDelete.product_name,
          quantity: itemToDelete.quantity,
          price: itemToDelete.price,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to remove cart item: ${error.message}`,
    });
  }
};
