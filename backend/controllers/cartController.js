import * as cartModel from "../models/cartModel.js";

// Get user's cart
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.getOrCreateCart(userId);
    const items = await cartModel.getCartItems(cart.id);

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: {
        items,
        total_items: cart.total_items,
        total_price: parseFloat(cart.total_price).toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving cart",
    });
  }
};

// Add item to cart
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const cart = await cartModel.getOrCreateCart(userId);
    const result = await cartModel.addToCart(cart.id, product_id, quantity);

    // Get updated cart totals
    const updatedCart = await cartModel.getOrCreateCart(userId);

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: {
        item: result,
        total_items: updatedCart.total_items,
        total_price: parseFloat(updatedCart.total_price).toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error adding item to cart",
    });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const cart = await cartModel.getOrCreateCart(userId);
    const result = await cartModel.updateCartItem(cart.id, itemId, quantity);

    // Get updated cart totals
    const updatedCart = await cartModel.getOrCreateCart(userId);

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: {
        item: result,
        total_items: updatedCart.total_items,
        total_price: parseFloat(updatedCart.total_price).toFixed(2),
      },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Error updating cart item",
    });
  }
};

// Deactivate cart item
export const deactivateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const cart = await cartModel.getOrCreateCart(userId);
    await cartModel.deactivateCartItem(cart.id, itemId);

    // Get updated cart totals
    const updatedCart = await cartModel.getOrCreateCart(userId);

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: {
        total_items: updatedCart.total_items,
        total_price: parseFloat(updatedCart.total_price).toFixed(2),
      },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Error removing item from cart",
    });
  }
};

// Deactivate all cart items
export const deactivateAllCartItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.getOrCreateCart(userId);
    await cartModel.deactivateAllCartItems(cart.id);

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        total_items: 0,
        total_price: "0.00",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error clearing cart",
    });
  }
};
