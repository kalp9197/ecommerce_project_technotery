import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Initialize wishlist table if not exists
export const ensureWishlistTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      uuid        VARCHAR(36) NOT NULL UNIQUE,
      user_id     INT         NOT NULL,
      is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating wishlist table: ${error.message}`);
  }
};

// Initialize wishlist_items table if not exists
export const ensureWishlistItemsTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      uuid        VARCHAR(36) NOT NULL UNIQUE,
      wishlist_id INT         NOT NULL,
      product_id  INT         NOT NULL,
      is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
      added_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating wishlist_items table: ${error.message}`);
  }
};

// Get active wishlist for user
const getWishlist = async (userId, connection = null) => {
  try {
    const queryFn = connection
      ? dbService.queryWithConnection.bind(null, connection)
      : dbService.query;

    let [wishlist] = await queryFn(
      `SELECT
          id,
          uuid
        FROM
          wishlist
        WHERE
          user_id = ? AND is_active = 1
        LIMIT
          1`,
      [userId]
    );

    return wishlist;
  } catch (error) {
    throw new Error(`Error retrieving wishlist: ${error.message}`);
  }
};

// Get all items in user's wishlist
export const getWishlistItems = async (userId) => {
  try {
    const wishlist = await getWishlist(userId);
    if (!wishlist) return { items: [] };

    const items = await dbService.query(
      `SELECT
         wi.id, wi.uuid as item_uuid, wi.added_at,
         p.uuid AS product_uuid, p.name, p.price, p.description,
         pc.name AS category_name,
         pi.image_path AS image
       FROM
         wishlist_items wi
       JOIN
         products p ON wi.product_id = p.id
       LEFT JOIN
         product_categories pc ON p.p_cat_id = pc.id
       LEFT JOIN
         product_images pi ON p.id = pi.p_id AND pi.is_featured = 1 AND pi.is_active = 1
       WHERE
         wi.wishlist_id = ? AND wi.is_active = 1 AND p.is_active = 1
       ORDER BY
         wi.added_at DESC`,
      [wishlist.id]
    );

    return { items };
  } catch (error) {
    throw new Error(`Error retrieving wishlist items: ${error.message}`);
  }
};

// Add product to wishlist
export const addToWishlist = async (userId, productUuid) => {
  let connection;
  try {
    // Start transaction for atomicity
    connection = await dbService.beginTransaction();

    // Get or create user's wishlist
    let wishlist = await getWishlist(userId, connection);
    if (!wishlist) {
      const uuid = uuidv4();
      const result = await dbService.queryWithConnection(
        connection,
        `INSERT INTO
            wishlist (uuid, user_id, is_active)
          VALUES
            (?, ?, 1)`,
        [uuid, userId]
      );
      [wishlist] = await dbService.queryWithConnection(
        connection,
        `SELECT
            id,
            uuid
          FROM
            wishlist
          WHERE
            id = ?`,
        [result.insertId]
      );
    }

    // Get product ID from UUID
    const [product] = await dbService.queryWithConnection(
      connection,
      `SELECT
          id,
          uuid,
          name
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!product) {
      throw new Error("Product not found or inactive");
    }

    // Check if product already exists in wishlist
    const [existing] = await dbService.queryWithConnection(
      connection,
      `SELECT
          id,
          is_active
        FROM
          wishlist_items
        WHERE
          wishlist_id = ? AND product_id = ?`,
      [wishlist.id, product.id]
    );

    if (existing) {
      if (existing.is_active === 1) {
        throw new Error("Product already in wishlist");
      }

      // Reactivate existing wishlist item
      await dbService.queryWithConnection(
        connection,
        `UPDATE
           wishlist_items
         SET
           is_active = 1,
           added_at = NOW()
         WHERE
           id = ?`,
        [existing.id]
      );
    } else {
      // Add new wishlist item
      await dbService.queryWithConnection(
        connection,
        `INSERT INTO
           wishlist_items (uuid, wishlist_id, product_id, is_active)
         VALUES
           (?, ?, ?, 1)`,
        [uuidv4(), wishlist.id, product.id]
      );
    }

    await dbService.commit(connection);
    return { success: true, wishlistUuid: wishlist.uuid };
  } catch (error) {
    if (connection) await dbService.rollback(connection);
    throw new Error(`Error adding to wishlist: ${error.message}`);
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (userId, itemUuid) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();

    const wishlist = await getWishlist(userId);
    if (!wishlist) throw new Error("Wishlist not found");

    const [item] = await dbService.queryWithConnection(
      connection,
      `SELECT
         wi.id
       FROM
         wishlist_items wi
       WHERE
         wi.uuid = ? AND wi.wishlist_id = ? AND wi.is_active = 1`,
      [itemUuid, wishlist.id]
    );

    if (!item) throw new Error("Item not found or already removed");

    await dbService.queryWithConnection(
      connection,
      `UPDATE
          wishlist_items
        SET
          is_active = 0
        WHERE
          id = ?`,
      [item.id]
    );

    await dbService.commit(connection);
    return { success: true };
  } catch (error) {
    if (connection) await dbService.rollback(connection);
    throw new Error(`Error removing from wishlist: ${error.message}`);
  }
};

// Clear all items from wishlist
export const clearWishlist = async (userId) => {
  let connection;
  try {
    connection = await dbService.beginTransaction();

    const wishlist = await getWishlist(userId);
    if (!wishlist) throw new Error("Wishlist not found");

    await dbService.queryWithConnection(
      connection,
      `UPDATE
          wishlist_items
        SET
          is_active = 0
        WHERE
          wishlist_id = ? AND is_active = 1`,
      [wishlist.id]
    );

    await dbService.commit(connection);
    return { success: true };
  } catch (error) {
    if (connection) await dbService.rollback(connection);
    throw new Error(`Error clearing wishlist: ${error.message}`);
  }
};

// Check if a product is in user's wishlist
export const isProductInWishlist = async (userId, productUuid) => {
  try {
    const wishlist = await getWishlist(userId);
    if (!wishlist) return false;

    const result = await dbService.query(
      `SELECT
         COUNT(*) as count
       FROM
         wishlist_items wi
       JOIN
         products p ON wi.product_id = p.id
       WHERE
         wi.wishlist_id = ? AND p.uuid = ? AND wi.is_active = 1`,
      [wishlist.id, productUuid]
    );

    return result[0].count > 0;
  } catch (error) {
    throw new Error(`Error checking wishlist: ${error.message}`);
  }
};
