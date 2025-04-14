import express from "express";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Simple in-memory cart storage by user ID
// In a real app, this would be stored in a database
const userCarts = new Map();

// All cart operations require authentication
router.use(authenticate);

// Helper function to get or create a cart for a user
const getUserCart = (userId) => {
  if (!userCarts.has(userId)) {
    userCarts.set(userId, []);
  }
  return userCarts.get(userId);
};

// GET user's cart
router.get("/", (req, res) => {
  const userId = req.user.id;
  const cart = getUserCart(userId);

  res.status(200).json({
    success: true,
    message: "Cart retrieved successfully",
    data: cart,
  });
});

// Add item to cart
router.post("/items", (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  const cart = getUserCart(userId);

  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(
    (item) => item.product_id === product_id
  );

  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += quantity;

    res.status(200).json({
      success: true,
      message: "Item quantity updated in cart",
      data: cart[existingItemIndex],
    });
  } else {
    // Add new item to cart
    const newItem = {
      id: `cart-item-${Date.now()}`,
      product_id,
      quantity,
      name: req.body.name || `Product ${product_id}`,
      price: req.body.price || 99.99,
      // Include other product details as needed
    };

    cart.push(newItem);

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: newItem,
    });
  }
});

// Update cart item
router.put("/items/:id", (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  const { quantity } = req.body;

  if (quantity === undefined || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Valid quantity is required",
    });
  }

  const cart = getUserCart(userId);
  const itemIndex = cart.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart",
    });
  }

  // Update item quantity
  cart[itemIndex].quantity = quantity;

  res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    data: cart[itemIndex],
  });
});

// Remove item from cart
router.delete("/items/:id", (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;

  const cart = getUserCart(userId);
  const initialLength = cart.length;

  // Remove item from cart
  const updatedCart = cart.filter((item) => item.id !== itemId);
  userCarts.set(userId, updatedCart);

  if (updatedCart.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart",
    });
  }

  res.status(200).json({
    success: true,
    message: "Item removed from cart successfully",
  });
});

// Clear cart
router.delete("/", (req, res) => {
  const userId = req.user.id;

  // Clear user's cart
  userCarts.set(userId, []);

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
  });
});

export default router;
