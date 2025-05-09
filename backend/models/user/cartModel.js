import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Create cart table if it doesn't exist
export const ensureCartTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating cart table: ${error.message}`);
  }
};

// Create cart items table if it doesn't exist
export const ensureCartItemsTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      cart_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating cart_items table: ${error.message}`);
  }
};

// Get user's cart or create if it doesn't exist
export const getCart = async (userId) => {
  try {
    const carts = await dbService.query(
      `SELECT
          *
        FROM
          cart
        WHERE
          user_id = ? AND is_active = 1`,
      [userId]
    );

    if (carts?.length) {
      return carts[0];
    }

    // Create new cart if none exists
    const uuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          cart (uuid, user_id)
        VALUES
          (?, ?)`,
      [uuid, userId]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create cart");
    }

    const newCarts = await dbService.query(
      `SELECT
          *
        FROM
          cart
        WHERE
          uuid = ?`,
      [uuid]
    );

    return newCarts?.length ? newCarts[0] : null;
  } catch (error) {
    throw new Error(`Error getting cart: ${error.message}`);
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

    let totalItems = 0;
    let totalPrice = 0;

    if (items?.length) {
      items.forEach((item) => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;
      });
    }

    return {
      items: items || [],
      total_items: totalItems,
      total_price: parseFloat(totalPrice.toFixed(2)),
    };
  } catch (error) {
    throw new Error(`Error fetching cart items: ${error.message}`);
  }
};

// Add item to cart
export const addItemToCart = async (userId, productId, quantity, price) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();

    // Check product availability
    const product = await dbService.queryWithConnection(
      connection,
      `SELECT
          *
        FROM
          products
        WHERE
          id = ? AND is_active = 1
        FOR UPDATE`,
      [productId]
    );

    if (!product?.length) {
      await dbService.rollback(connection);
      throw new Error("Product not found or inactive");
    }

    if (product[0].quantity < quantity) {
      await dbService.rollback(connection);
      throw new Error("Not enough product in stock");
    }

    // Get or create cart
    const cart = await getCart(userId);

    // Check if product already in cart
    const existingItems = await dbService.queryWithConnection(
      connection,
      `SELECT
          *
        FROM
          cart_items
        WHERE
          cart_id = ? AND product_id = ? AND is_active = 1
        FOR UPDATE`,
      [cart.id, productId]
    );

    let result;
    if (existingItems?.length) {
      // Update existing item
      const newQuantity = existingItems[0].quantity + quantity;
      result = await dbService.queryWithConnection(
        connection,
        `UPDATE
            cart_items
          SET
            quantity = ?,
            price = ?
          WHERE
            id = ?`,
        [newQuantity, price, existingItems[0].id]
      );
    } else {
      // Add new item
      const uuid = uuidv4();
      result = await dbService.queryWithConnection(
        connection,
        `INSERT INTO
            cart_items (uuid, cart_id, product_id, quantity, price)
          VALUES
            (?, ?, ?, ?, ?)`,
        [uuid, cart.id, productId, quantity, price]
      );
    }

    // Update product inventory
    await dbService.queryWithConnection(
      connection,
      `UPDATE
          products
        SET
          quantity = quantity - ?
        WHERE
          id = ?`,
      [quantity, productId]
    );

    await dbService.commit(connection);
    return result?.affectedRows > 0;
  } catch (error) {
    if (connection) await dbService.rollback(connection);
    throw new Error(`Error adding item to cart: ${error.message}`);
  }
};

// Update cart item quantity
export const updateCartItem = async (itemUuid, quantity, userId) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();

    // Get cart item
    const items = await dbService.queryWithConnection(
      connection,
      `SELECT
          ci.*,
          c.user_id
        FROM
          cart_items ci
        JOIN
          cart c ON ci.cart_id = c.id
        WHERE
          ci.uuid = ? AND ci.is_active = 1
        FOR UPDATE`,
      [itemUuid]
    );

    if (!items?.length) {
      await dbService.rollback(connection);
      throw new Error("Cart item not found");
    }

    if (items[0].user_id !== userId) {
      await dbService.rollback(connection);
      throw new Error("Unauthorized access to cart item");
    }

    const item = items[0];
    const quantityDiff = quantity - item.quantity;

    // Check product availability if increasing quantity
    if (quantityDiff > 0) {
      const product = await dbService.queryWithConnection(
        connection,
        `SELECT
            *
          FROM
            products
          WHERE
            id = ? AND is_active = 1
          FOR UPDATE`,
        [item.product_id]
      );

      if (!product?.length || product[0].quantity < quantityDiff) {
        await dbService.rollback(connection);
        throw new Error("Not enough product in stock");
      }

      // Update product inventory
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
    } else if (quantityDiff < 0) {
      // Return items to inventory if decreasing quantity
      await dbService.queryWithConnection(
        connection,
        `UPDATE
            products
          SET
            quantity = quantity + ?
          WHERE
            id = ?`,
        [Math.abs(quantityDiff), item.product_id]
      );
    }

    // Update cart item
    const result = await dbService.queryWithConnection(
      connection,
      `UPDATE
          cart_items
        SET
          quantity = ?
        WHERE
          id = ?`,
      [quantity, item.id]
    );

    await dbService.commit(connection);
    return result?.affectedRows > 0;
  } catch (error) {
    if (connection) await dbService.rollback(connection);
    throw new Error(`Error updating cart item: ${error.message}`);
  }
};
