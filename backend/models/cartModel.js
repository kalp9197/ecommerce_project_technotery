import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

// Get or create active cart for user
const getCart = async (userId) => {
  try {
    const [cart] = await query(
      "SELECT id, uuid, total_items, total_price FROM cart WHERE user_id = ? AND is_active = 1 LIMIT 1",
      [userId]
    );
    return cart || null; // Return null if no cart exists
  } catch (error) {
    throw new Error(`Error retrieving cart: ${error.message}`);
  }
};

// Update cart totals (items count and price sum)
const updateCartTotals = async (cartUuid) => {
  try {
    const [totals] = await query(
      "SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity * price), 0) AS total_price FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.uuid = ? AND ci.is_active = 1",
      [cartUuid]
    );

    await query(
      "UPDATE cart SET total_items = ?, total_price = ?, updated_at = NOW() WHERE uuid = ?",
      [totals.total_items, totals.total_price, cartUuid]
    );
  } catch (error) {
    throw new Error(`Error updating cart totals: ${error.message}`);
  }
};

// Add product to cart or update quantity if already exists
export const addToCart = async (userId, productUuid, quantity = 1) => {
  try {
    let cart = await getCart(userId);

    // Create new cart if none exists
    if (!cart) {
      const uuid = uuidv4();
      const result = await query(
        "INSERT INTO cart (uuid, user_id, total_items, total_price, is_active) VALUES (?, ?, 0, 0, 1)",
        [uuid, userId]
      );
      [cart] = await query(
        "SELECT id, uuid, total_items, total_price FROM cart WHERE id = ?",
        [result.insertId]
      );
    }

    const [product] = await query(
      `SELECT p.id, p.price, p.quantity, p.name
       FROM products p
       WHERE p.uuid = ? AND p.is_active = 1`,
      [productUuid]
    );

    if (!product) throw new Error("Product not found or inactive");

    if (product.quantity < quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Only ${product.quantity} available.`
      );
    }

    const [existing] = await query(
      `SELECT ci.id, ci.quantity, ci.is_active
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.id
       WHERE c.uuid = ? AND ci.product_id = ?`,
      [cart.uuid, product.id]
    );

    if (existing) {
      const newQty = existing.is_active
        ? existing.quantity + quantity
        : quantity;
      await query(
        `UPDATE cart_items 
         SET quantity = ?, price = ?, is_active = 1, added_at = NOW() 
         WHERE id = ?`,
        [newQty, product.price, existing.id]
      );

      // Update product quantity in inventory
      await query(`UPDATE products SET quantity = quantity - ? WHERE id = ?`, [
        quantity,
        product.id,
      ]);
    } else {
      await query(
        `INSERT INTO cart_items 
         (uuid, cart_id, product_id, quantity, price, is_active, added_at) 
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [uuidv4(), cart.id, product.id, quantity, product.price]
      );

      // Update product quantity in inventory
      await query(`UPDATE products SET quantity = quantity - ? WHERE id = ?`, [
        quantity,
        product.id,
      ]);
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
         ci.id, ci.uuid as item_uuid, ci.quantity, ci.price, ci.is_active,
         p.uuid AS product_uuid, p.name, p.price AS current_price,
         pc.name AS category_name,
         pi.image_path AS image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_categories pc ON p.p_cat_id = pc.id
       LEFT JOIN product_images pi 
         ON p.id = pi.p_id AND pi.is_featured = 1 AND pi.is_active = 1
       WHERE ci.cart_id = ? AND ci.is_active = 1
       ORDER BY ci.added_at DESC`,
      [cart.id]
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
export const updateCartItem = async (userId, itemUuid, quantity) => {
  try {
    const cart = await getCart(userId);

    const [item] = await query(
      `SELECT ci.id, ci.uuid, ci.quantity, ci.product_id, p.uuid as product_uuid, p.price, p.quantity as available_quantity, p.name 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.uuid = ? AND ci.cart_id = ? AND ci.is_active = 1 AND p.is_active = 1`,
      [itemUuid, cart.id]
    );

    if (!item) throw new Error("Item not found or inactive");

    // Calculate quantity difference for inventory update
    const quantityDiff = quantity - item.quantity;

    // Check if there's enough stock for an increase in quantity
    if (quantityDiff > 0 && item.available_quantity < quantityDiff) {
      throw new Error(
        `Insufficient stock for ${item.name}. Only ${item.available_quantity} additional units available.`
      );
    }

    // Update cart item quantity
    await query("UPDATE cart_items SET quantity = ? WHERE uuid = ?", [
      quantity,
      item.uuid,
    ]);

    // Update product inventory - only if quantity is changing
    if (quantityDiff !== 0) {
      await query(`UPDATE products SET quantity = quantity - ? WHERE id = ?`, [
        quantityDiff,
        item.product_id,
      ]);
    }

    await updateCartTotals(cart.uuid);

    return {
      item_uuid: item.uuid,
      product_uuid: item.product_uuid,
      quantity,
      price: +item.price,
    };
  } catch (error) {
    throw new Error(`Error updating cart item: ${error.message}`);
  }
};

// Remove item from cart (soft delete)
export const deactivateCartItem = async (userId, itemUuid) => {
  try {
    const cart = await getCart(userId);

    const [item] = await query(
      `SELECT ci.id, ci.uuid, ci.quantity, ci.product_id, p.uuid as product_uuid
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.uuid = ? AND ci.cart_id = ? AND ci.is_active = 1`,
      [itemUuid, cart.id]
    );

    if (!item) throw new Error("Item not found or already inactive");

    // Return quantity to product inventory
    await query("UPDATE products SET quantity = quantity + ? WHERE id = ?", [
      item.quantity,
      item.product_id,
    ]);

    await query("UPDATE cart_items SET is_active = 0 WHERE uuid = ?", [
      item.uuid,
    ]);

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

    // Get all active cart items to return quantities to inventory
    const cartItems = await query(
      "SELECT product_id, quantity FROM cart_items WHERE cart_id = ? AND is_active = 1",
      [cart.id]
    );

    // Return quantities to inventory for each item
    for (const item of cartItems) {
      await query("UPDATE products SET quantity = quantity + ? WHERE id = ?", [
        item.quantity,
        item.product_id,
      ]);
    }

    await query(
      "UPDATE cart_items SET is_active = 0 WHERE cart_id = (SELECT id FROM cart WHERE uuid = ?) AND is_active = 1",
      [cart.uuid]
    );

    await updateCartTotals(cart.uuid);

    return { success: true };
  } catch (error) {
    throw new Error(`Error deactivating all cart items: ${error.message}`);
  }
};
