import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

// Get or create cart for a user
export const getOrCreateCart = async (userId) => {
  try {
    const [cart] = await query(
      `SELECT id, uuid, total_items, total_price 
       FROM cart 
       WHERE user_id = ? AND is_active = 1 
       LIMIT 1`,
      [userId]
    );

    if (cart) return cart;

    const uuid = uuidv4();
    const result = await query(
      `INSERT INTO cart (uuid, user_id, is_active, total_items, total_price, created_at, updated_at)
       VALUES (?, ?, 1, 0, 0.00, NOW(), NOW())`,
      [uuid, userId]
    );

    const [newCart] = await query(
      `SELECT id, uuid, total_items, total_price 
       FROM cart 
       WHERE id = ?`,
      [result.insertId]
    );

    return newCart;
  } catch (error) {
    throw new Error(`Error getting/creating cart: ${error.message}`);
  }
};

// Get cart items with product info
export const getCartItems = async (cartId) => {
  try {
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
      [cartId]
    );

    return items.map((item) => ({
      ...item,
      price: +item.price || 0,
      current_price: +item.current_price || 0,
    }));
  } catch (error) {
    throw new Error(`Error fetching cart items: ${error.message}`);
  }
};

// Update cart totals
const updateCartTotals = async (cartId) => {
  try {
    const [totals] = await query(
      `SELECT COUNT(*) AS total_items, 
              COALESCE(SUM(quantity * price), 0) AS total_price 
       FROM cart_items 
       WHERE cart_id = ? AND is_active = 1`,
      [cartId]
    );

    await query(
      `UPDATE cart 
       SET total_items = ?, total_price = ?, updated_at = NOW() 
       WHERE id = ?`,
      [totals.total_items, totals.total_price, cartId]
    );
  } catch (error) {
    throw new Error(`Error updating cart totals: ${error.message}`);
  }
};

// Add item to cart
export const addToCart = async (cartId, productUuid, quantity = 1) => {
  try {
    const [product] = await query(
      `SELECT id, price FROM products 
       WHERE uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!product) throw new Error("Product not found or inactive");

    const [existing] = await query(
      `SELECT id, quantity, is_active FROM cart_items 
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, product.id]
    );

    if (existing) {
      const newQty = existing.is_active ? existing.quantity + quantity : quantity;
      await query(
        `UPDATE cart_items 
         SET quantity = ?, price = ?, is_active = 1, added_at = NOW() 
         WHERE id = ?`,
        [newQty, product.price, existing.id]
      );
    } else {
      await query(
        `INSERT INTO cart_items (cart_id, product_id, quantity, price, is_active, added_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [cartId, product.id, quantity, product.price]
      );
    }

    await updateCartTotals(cartId);

    return { product_id: product.id, quantity, price: product.price };
  } catch (error) {
    throw new Error(`Error adding to cart: ${error.message}`);
  }
};

// Update cart item quantity
export const updateCartItem = async (cartId, itemId, quantity) => {
  try {
    const [item] = await query(
      `SELECT ci.id, p.price 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = ? AND ci.cart_id = ? AND ci.is_active = 1 AND p.is_active = 1`,
      [itemId, cartId]
    );

    if (!item) throw new Error("Item not found or inactive");

    await query(
      `UPDATE cart_items SET quantity = ? WHERE id = ?`,
      [quantity, itemId]
    );

    await updateCartTotals(cartId);

    return { id: itemId, quantity, price: +item.price };
  } catch (error) {
    throw new Error(`Error updating cart item: ${error.message}`);
  }
};

// Deactivate a cart item
export const deactivateCartItem = async (cartId, itemId) => {
  try {
    const [item] = await query(
      `SELECT id FROM cart_items 
       WHERE id = ? AND cart_id = ? AND is_active = 1`,
      [itemId, cartId]
    );

    if (!item) throw new Error("Item not found or already inactive");

    await query(
      `UPDATE cart_items SET is_active = 0 WHERE id = ?`,
      [itemId]
    );

    await updateCartTotals(cartId);

    return { success: true };
  } catch (error) {
    throw new Error(`Error deactivating cart item: ${error.message}`);
  }
};

// Deactivate all items in cart
export const deactivateAllCartItems = async (cartId) => {
  try {
    await query(
      `UPDATE cart_items 
       SET is_active = 0 
       WHERE cart_id = ? AND is_active = 1`,
      [cartId]
    );

    await updateCartTotals(cartId);

    return { success: true };
  } catch (error) {
    throw new Error(`Error clearing cart: ${error.message}`);
  }
};
