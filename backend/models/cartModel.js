import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Get active cart for user
const getCart = async (userId, connection = null) => {
  try {
    const queryFn = connection
      ? dbService.queryWithConnection.bind(null, connection)
      : dbService.query;

    let [cart] = await queryFn(
      `SELECT
          id,
          uuid,
          total_items,
          total_price
        FROM
          cart
        WHERE
          user_id = ? AND is_active = 1
        LIMIT
          1`,
      [userId]
    );

    return cart;
  } catch (error) {
    throw new Error(`Error retrieving cart: ${error.message}`);
  }
};

// Get all items in user's cart
export const getCartItems = async (userId) => {
  try {
    const cart = await getCart(userId);
    if (!cart) return { items: [], total_items: 0, total_price: 0 };

    const items = await dbService.query(
      `SELECT
         ci.id, ci.uuid as item_uuid, ci.quantity, ci.price, ci.is_active,
         p.uuid AS product_uuid, p.name, p.price AS current_price,
         pc.name AS category_name,
         pi.image_path AS image
       FROM
         cart_items ci
       JOIN
         products p ON ci.product_id = p.id
       LEFT JOIN
         product_categories pc ON p.p_cat_id = pc.id
       LEFT JOIN
         product_images pi ON p.id = pi.p_id AND pi.is_featured = 1 AND pi.is_active = 1
       WHERE
         ci.cart_id = ? AND ci.is_active = 1
       ORDER BY
         ci.id ASC`,
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

// Update cart totals based on current items
const updateCartTotals = async (cartUuid, connection = null) => {
  try {
    const queryFn = connection
      ? dbService.queryWithConnection.bind(null, connection)
      : dbService.query;

    // Calculate sum of items and total price
    const [totals] = await queryFn(
      `SELECT
        COUNT(*) AS total_items,
        COALESCE(SUM(quantity * price), 0) AS total_price
       FROM
         cart_items ci
       JOIN
         cart c ON ci.cart_id = c.id
       WHERE
         c.uuid = ? AND ci.is_active = 1`,
      [cartUuid]
    );

    // Update cart with new totals
    await queryFn(
      `UPDATE
          cart
        SET
          total_items = ?,
          total_price = ?,
          updated_at = NOW()
        WHERE
          uuid = ?`,
      [totals.total_items, totals.total_price, cartUuid]
    );

    return totals;
  } catch (error) {
    throw new Error(`Error updating cart totals: ${error.message}`);
  }
};

// Add product to cart with inventory check
export const addToCart = async (userId, productUuid, quantity = 1) => {
  let connection;
  try {
    // Start transaction for atomicity
    connection = await dbService.beginTransaction();

    // Get or create user's cart
    let cart = await getCart(userId, connection);
    if (!cart) {
      const uuid = uuidv4();
      const result = await dbService.queryWithConnection(
        connection,
        `INSERT INTO
            cart (uuid, user_id, total_items, total_price, is_active)
          VALUES
            (?, ?, 0, 0, 1)`,
        [uuid, userId]
      );
      [cart] = await dbService.queryWithConnection(
        connection,
        `SELECT
            id,
            uuid,
            total_items,
            total_price
          FROM
            cart
          WHERE
            id = ?`,
        [result.insertId]
      );
    }

    // Lock product row for inventory check
    const [product] = await dbService.queryWithConnection(
      connection,
      `SELECT
         p.id, p.price, p.quantity, p.name
       FROM
         products p
       WHERE
         p.uuid = ? AND p.is_active = 1
       FOR UPDATE`,
      [productUuid]
    );

    if (!product) throw new Error("Product not found or inactive");

    // Check if sufficient inventory exists
    if (product.quantity < quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Only ${product.quantity} available.`
      );
    }

    // Check if product already in cart
    const [existing] = await dbService.queryWithConnection(
      connection,
      `SELECT
         ci.id, ci.quantity, ci.is_active
       FROM
         cart_items ci
       JOIN
         cart c ON ci.cart_id = c.id
       WHERE
         c.uuid = ? AND ci.product_id = ?
       FOR UPDATE`,
      [cart.uuid, product.id]
    );

    if (existing) {
      // Update existing cart item
      const newQty = existing.is_active
        ? existing.quantity + quantity
        : quantity;

      await dbService.queryWithConnection(
        connection,
        `UPDATE
           cart_items
         SET
           quantity = ?,
           price = ?,
           is_active = 1
         WHERE
           id = ?`,
        [newQty, product.price, existing.id]
      );
    } else {
      // Add new cart item
      await dbService.queryWithConnection(
        connection,
        `INSERT INTO
           cart_items (uuid, cart_id, product_id, quantity, price, is_active)
         VALUES
           (?, ?, ?, ?, ?, 1)`,
        [uuidv4(), cart.id, product.id, quantity, product.price]
      );
    }

    // Decrease product inventory
    await dbService.queryWithConnection(
      connection,
      `UPDATE
          products
        SET
          quantity = quantity - ?
        WHERE
          id = ?`,
      [quantity, product.id]
    );

    // Update cart totals and commit transaction
    await updateCartTotals(cart.uuid, connection);
    await dbService.commit(connection);

    return { product_id: product.id, quantity, price: product.price };
  } catch (error) {
    // Rollback on any error
    if (connection) {
      await dbService.rollback(connection);
    }
    throw new Error(`Error adding to cart: ${error.message}`);
  }
};

// Update cart item quantity
export const updateCartItem = async (userId, itemUuid, quantity) => {
  let connection;
  try {
    // Start transaction for atomicity
    connection = await dbService.beginTransaction();

    const cart = await getCart(userId, connection);

    // Get cart item with product details and lock row
    const [item] = await dbService.queryWithConnection(
      connection,
      `SELECT
         ci.id, ci.uuid, ci.quantity, ci.product_id, p.uuid as product_uuid, p.price, p.quantity as available_quantity, p.name
       FROM
         cart_items ci
       JOIN
         products p ON ci.product_id = p.id
       WHERE
         ci.uuid = ? AND ci.cart_id = ? AND ci.is_active = 1 AND p.is_active = 1
       FOR UPDATE`,
      [itemUuid, cart.id]
    );

    if (!item) throw new Error("Item not found or inactive");

    // Calculate the change in quantity
    const quantityDiff = quantity - item.quantity;

    // Check if sufficient inventory for quantity increase
    if (quantityDiff > 0 && item.available_quantity < quantityDiff) {
      throw new Error(
        `Insufficient stock for ${item.name}. Only ${item.available_quantity} additional units available.`
      );
    }

    // Update cart item quantity
    await dbService.queryWithConnection(
      connection,
      `UPDATE
          cart_items
        SET
          quantity = ?
        WHERE
          uuid = ?`,
      [quantity, item.uuid]
    );

    // Update product inventory if quantity changed
    if (quantityDiff !== 0) {
      await dbService.queryWithConnection(
        connection,
        `UPDATE
            products
          SET
            quantity = quantity - ?
          WHERE
            id = ?`,
        [quantityDiff, item.product_id]
      );
    }

    // Update cart totals and commit transaction
    await updateCartTotals(cart.uuid, connection);
    await dbService.commit(connection);

    return {
      item_uuid: item.uuid,
      product_uuid: item.product_uuid,
      quantity,
      price: +item.price,
    };
  } catch (error) {
    // Rollback on any error
    if (connection) {
      await dbService.rollback(connection);
    }
    throw new Error(`Error updating cart item: ${error.message}`);
  }
};

// Remove item from cart
export const deactivateCartItem = async (userId, itemUuid) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();

    const cart = await getCart(userId);

    const [item] = await dbService.queryWithConnection(
      connection,
      `SELECT
         ci.id, ci.uuid, ci.quantity, ci.product_id, p.uuid as product_uuid
       FROM
         cart_items ci
       JOIN
         products p ON ci.product_id = p.id
       WHERE
         ci.uuid = ? AND ci.cart_id = ? AND ci.is_active = 1
       FOR UPDATE`,
      [itemUuid, cart.id]
    );

    if (!item) throw new Error("Item not found or already inactive");

    await dbService.queryWithConnection(
      connection,
      `UPDATE
          products
        SET
          quantity = quantity + ?
        WHERE
          id = ?`,
      [item.quantity, item.product_id]
    );

    await dbService.queryWithConnection(
      connection,
      `UPDATE
          cart_items
        SET
          is_active = 0
        WHERE
          uuid = ?`,
      [item.uuid]
    );

    await updateCartTotals(cart.uuid, connection);
    await dbService.commit(connection);

    return { success: true };
  } catch (error) {
    if (connection) {
      await dbService.rollback(connection);
    }
    throw new Error(`Error deactivating cart item: ${error.message}`);
  }
};

// Empty the entire cart
export const deactivateAllCartItems = async (userId) => {
  let connection;
  try {
    // Start transaction for atomicity
    connection = await dbService.beginTransaction();

    const cart = await getCart(userId);

    // Get all active cart items to restore inventory
    const cartItems = await dbService.queryWithConnection(
      connection,
      `SELECT
          product_id,
          quantity
        FROM
          cart_items
        WHERE
          cart_id = ? AND is_active = 1
        FOR UPDATE`,
      [cart.id]
    );

    // Return items to inventory
    for (const item of cartItems) {
      await dbService.queryWithConnection(
        connection,
        `UPDATE
            products
          SET
            quantity = quantity + ?
          WHERE
            id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Mark all items as inactive
    await dbService.queryWithConnection(
      connection,
      `UPDATE
          cart_items
        SET
          is_active = 0
        WHERE
          cart_id = ? AND is_active = 1`,
      [cart.id]
    );

    // Update cart totals and commit transaction
    await updateCartTotals(cart.uuid, connection);
    await dbService.commit(connection);

    return { success: true };
  } catch (error) {
    // Rollback on any error
    if (connection) {
      await dbService.rollback(connection);
    }
    throw new Error(`Error deactivating all cart items: ${error.message}`);
  }
};

// Update multiple cart items in one operation
export const batchUpdateCartItems = async (userId, items) => {
  try {
    const cart = await getCart(userId);
    if (!cart) throw new Error("Cart not found");

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const result = await updateCartItem(
          userId,
          item.item_uuid,
          item.quantity
        );
        results.push(result);
      } catch (error) {
        errors.push({
          item_uuid: item.item_uuid,
          error: error.message,
        });
      }
    }

    return {
      success: results,
      errors,
    };
  } catch (error) {
    throw new Error(`Error updating cart items: ${error.message}`);
  }
};

// Mark cart as processed after checkout
export const completeOrder = async (userId) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();

    const cart = await getCart(userId);
    if (!cart) {
      throw new Error("No active cart found");
    }

    await dbService.queryWithConnection(
      connection,
      `UPDATE
          cart
        SET
          is_active = 0,
          updated_at = NOW()
        WHERE
          id = ?`,
      [cart.id]
    );

    await dbService.commit(connection);
    return { success: true };
  } catch (error) {
    if (connection) {
      await dbService.rollback(connection);
    }
    throw new Error(`Error completing order: ${error.message}`);
  }
};
