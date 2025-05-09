import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Create wishlist table if it doesn't exist
export const ensureWishlistTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS wishlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating wishlist table: ${error.message}`);
  }
};

// Create wishlist items table if it doesn't exist
export const ensureWishlistItemsTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS wishlist_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      wishlist_id INT NOT NULL,
      product_id INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating wishlist_items table: ${error.message}`);
  }
};

// Get user's wishlist or create if it doesn't exist
export const getWishlist = async (userId) => {
  try {
    const wishlists = await dbService.query(
      `SELECT
          *
        FROM
          wishlist
        WHERE
          user_id = ? AND is_active = 1`,
      [userId]
    );

    if (wishlists?.length) {
      return wishlists[0];
    }

    // Create new wishlist if none exists
    const uuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          wishlist (uuid, user_id)
        VALUES
          (?, ?)`,
      [uuid, userId]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create wishlist");
    }

    const newWishlists = await dbService.query(
      `SELECT
          *
        FROM
          wishlist
        WHERE
          uuid = ?`,
      [uuid]
    );

    return newWishlists?.length ? newWishlists[0] : null;
  } catch (error) {
    throw new Error(`Error getting wishlist: ${error.message}`);
  }
};

// Get all items in user's wishlist
export const getWishlistItems = async (userId) => {
  try {
    const wishlist = await getWishlist(userId);
    if (!wishlist) return { items: [] };

    const items = await dbService.query(
      `SELECT
         wi.id, wi.uuid as item_uuid,
         p.uuid AS product_uuid, p.name, p.description, p.price,
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
         wi.id DESC`,
      [wishlist.id]
    );

    return {
      items: items || [],
    };
  } catch (error) {
    throw new Error(`Error fetching wishlist items: ${error.message}`);
  }
};

// Add product to wishlist
export const addToWishlist = async (userId, productUuid) => {
  try {
    // Get product ID
    const products = await dbService.query(
      `SELECT
          id
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!products?.length) {
      throw new Error("Product not found");
    }

    const productId = products[0].id;

    // Get or create wishlist
    const wishlist = await getWishlist(userId);

    // Check if product already in wishlist
    const existingItems = await dbService.query(
      `SELECT
          *
        FROM
          wishlist_items
        WHERE
          wishlist_id = ? AND product_id = ? AND is_active = 1`,
      [wishlist.id, productId]
    );

    if (existingItems?.length) {
      return { success: true, message: "Product already in wishlist" };
    }

    // Add product to wishlist
    const uuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          wishlist_items (uuid, wishlist_id, product_id)
        VALUES
          (?, ?, ?)`,
      [uuid, wishlist.id, productId]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to add product to wishlist");
    }

    return { success: true, uuid };
  } catch (error) {
    throw new Error(`Error adding to wishlist: ${error.message}`);
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (userId, productUuid) => {
  try {
    // Get product ID
    const products = await dbService.query(
      `SELECT
          id
        FROM
          products
        WHERE
          uuid = ?`,
      [productUuid]
    );

    if (!products?.length) {
      throw new Error("Product not found");
    }

    const productId = products[0].id;

    // Get wishlist
    const wishlist = await getWishlist(userId);

    // Remove product from wishlist
    const result = await dbService.query(
      `UPDATE
          wishlist_items
        SET
          is_active = 0
        WHERE
          wishlist_id = ? AND product_id = ? AND is_active = 1`,
      [wishlist.id, productId]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error removing from wishlist: ${error.message}`);
  }
};

// Clear entire wishlist
export const clearWishlist = async (userId) => {
  try {
    // Get wishlist
    const wishlist = await getWishlist(userId);

    // Clear wishlist
    const result = await dbService.query(
      `UPDATE
          wishlist_items
        SET
          is_active = 0
        WHERE
          wishlist_id = ? AND is_active = 1`,
      [wishlist.id]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error clearing wishlist: ${error.message}`);
  }
};
