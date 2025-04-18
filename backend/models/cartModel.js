import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

// Get or create active cart for user
const getCart = async (userId) => {
  try {
    const [cart] = await query(
      "SELECT id, uuid, total_items, total_price FROM cart WHERE user_id = ? AND is_active = 1 LIMIT 1",
      [userId],
    );

    if (!cart) {
      // Create new cart if none exists
      const uuid = uuidv4();
      const result = await query(
        "INSERT INTO cart (uuid, user_id, total_items, total_price, is_active) VALUES (?, ?, 0, 0, 1)",
        [uuid, userId],
      );

      const [newCart] = await query(
        "SELECT id, uuid, total_items, total_price FROM cart WHERE id = ?",
        [result.insertId],
      );
      return newCart;
    }

    return cart;
  } catch (error) {
    throw new Error(`Error retrieving cart: ${error.message}`);
  }
};

// Update cart totals (items count and price sum)
const updateCartTotals = async (cartUuid) => {
  try {
    const [totals] = await query(
      "SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity * price), 0) AS total_price FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.uuid = ? AND ci.is_active = 1",
      [cartUuid],
    );

    await query(
      "UPDATE cart SET total_items = ?, total_price = ?, updated_at = NOW() WHERE uuid = ?",
      [totals.total_items, totals.total_price, cartUuid],
    );
  } catch (error) {
    throw new Error(`Error updating cart totals: ${error.message}`);
  }
};

// Add product to cart or update quantity if already exists
export const addToCart = async (userId, productUuid, quantity = 1) => {
  try {
    const cart = await getCart(userId);

    const [product] = await query(
      `SELECT p.id, p.price
       FROM products p
       WHERE p.uuid = ? AND p.is_active = 1`,
      [productUuid],
    );

    if (!product) throw new Error("Product not found or inactive");

    const [existing] = await query(
      `SELECT ci.id, ci.quantity, ci.is_active
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.id
       WHERE c.uuid = ? AND ci.product_id = ?`,
      [cart.uuid, product.id],
    );

    if (existing) {
      const newQty = existing.is_active
        ? existing.quantity + quantity
        : quantity;
      await query(
        `UPDATE cart_items 
         SET quantity = ?, price = ?, is_active = 1, added_at = NOW() 
         WHERE id = ?`,
        [newQty, product.price, existing.id],
      );
    } else {
      await query(
        `INSERT INTO cart_items 
         (uuid, cart_id, product_id, quantity, price, is_active, added_at) 
         VALUES (?, (SELECT id FROM cart WHERE uuid = ?), ?, ?, ?, 1, NOW())`,
        [uuidv4(), cart.uuid, product.id, quantity, product.price],
      );
    }

    await updateCartTotals(cart.uuid);

    return { product_id: product.id, quantity, price: product.price };
  } catch (error) {
    throw new Error(`Error adding to cart: ${error.message}`);
  }
};

// Get all active cart items with product info
export const getCartItems = async (userId) => {
  try {
    const cart = await getCart(userId);

    const items = await query(
      `SELECT 
         ci.id, ci.quantity, ci.price, ci.is_active,
         p.uuid AS product_id, p.name, p.price AS current_price,
         pc.name AS category_name,
         pi.image_path AS image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_categories pc ON p.p_cat_id = pc.id
       LEFT JOIN product_images pi 
         ON p.id = pi.p_id AND pi.is_featured = 1 AND pi.is_active = 1
       WHERE ci.cart_id = ? AND ci.is_active = 1
       ORDER BY ci.added_at DESC`,
      [cart.id],
    );

    return {
      items: items.map((item) => ({
        ...item,
        price: +item.price || 0,
        current_price: +item.current_price || 0,
      })),
      total_items: cart.total_items,
      total_price: parseFloat(cart.total_price).toFixed(2),
    };
  } catch (error) {
    throw new Error(`Error getting cart items: ${error.message}`);
  }
};

// Update item quantity and recalculate cart totals
export const updateCartItem = async (userId, itemId, quantity) => {
  try {
    const cart = await getCart(userId);

    const [item] = await query(
      `SELECT ci.id, p.price FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ci.cart_id = ? AND ci.is_active = 1 AND p.is_active = 1`,
      [itemId, cart.id],
    );

    if (!item) throw new Error("Item not found or inactive");

    await query("UPDATE cart_items SET quantity = ? WHERE id = ?", [
      quantity,
      itemId,
    ]);

    await updateCartTotals(cart.uuid);

    return { id: itemId, quantity, price: +item.price };
  } catch (error) {
    throw new Error(`Error updating cart item: ${error.message}`);
  }
};

// Remove item from cart (soft delete)
export const deactivateCartItem = async (userId, itemId) => {
  try {
    const cart = await getCart(userId);

    const [item] = await query(
      "SELECT id FROM cart_items WHERE id = ? AND cart_id = ? AND is_active = 1",
      [itemId, cart.id],
    );

    if (!item) throw new Error("Item not found or already inactive");

    await query("UPDATE cart_items SET is_active = 0 WHERE id = ?", [itemId]);

    await updateCartTotals(cart.uuid);

    return { success: true };
  } catch (error) {
    throw new Error(`Error deactivating cart item: ${error.message}`);
  }
};

// Empty cart by deactivating all items
export const deactivateAllCartItems = async (userId) => {
  try {
    const cart = await getCart(userId);

    await query(
      "UPDATE cart_items SET is_active = 0 WHERE cart_id = (SELECT id FROM cart WHERE uuid = ?) AND is_active = 1",
      [cart.uuid],
    );

    await updateCartTotals(cart.uuid);

    return { success: true };
  } catch (error) {
    throw new Error(`Error deactivating all cart items: ${error.message}`);
  }
};

// Get all carts for admin 
export const getAllCarts = async () => {
  try {
    const carts = await query(
      `SELECT c.id, c.uuid, c.user_id, c.total_items, c.total_price, u.name AS user_name
       FROM cart c
       JOIN users u ON c.user_id = u.id
       WHERE c.is_active = 1`,
    );

    return carts.map((cart) => ({
      ...cart,
      total_price: parseFloat(cart.total_price).toFixed(2),
    }));
  } catch (error) {
    throw new Error(`Error getting all carts: ${error.message}`);
  }
}

// Get cart by user UUID for admin
export const getUserCartByAdmin = async (userUuid) => {
  try {
    const [cart] = await query(
      `SELECT c.id, c.uuid, c.total_items, c.total_price, u.name AS user_name
       FROM cart c
       JOIN users u ON c.user_id = u.id
       WHERE u.uuid = ? AND c.is_active = 1`,
      [userUuid],
    );

    if (!cart) throw new Error("Cart not found for this user");

    const items = await query(
      `SELECT 
         ci.id, ci.quantity, ci.price, ci.is_active,
         p.uuid AS product_id, p.name, p.price AS current_price,
         pc.name AS category_name,
         pi.image_path AS image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_categories pc ON p.p_cat_id = pc.id
       LEFT JOIN product_images pi 
         ON p.id = pi.p_id AND pi.is_featured = 1 AND pi.is_active = 1
       WHERE ci.cart_id = ? AND ci.is_active = 1`,
      [cart.id],
    );

    return {
      ...cart,
      items: items.map((item) => ({
        ...item,
        price: +item.price || 0,
        current_price: +item.current_price || 0,
      })),
    };
  } catch (error) {
    throw new Error(`Error getting user cart: ${error.message}`);
  }
};