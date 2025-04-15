import * as cartModel from "../models/cartModel.js";

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
    console.log(error.message)
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
