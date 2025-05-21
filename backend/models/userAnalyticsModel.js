import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";

export const ensureUserAnalyticsTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS user_analytics (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      uuid              VARCHAR(36) NOT NULL UNIQUE,
      user_id           INT         NOT NULL,
      event_type        ENUM('add_to_cart', 'remove_from_cart', 'add_to_wishlist', 'remove_from_wishlist') NOT NULL,
      product_id        INT,
      quantity          INT,
      created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )`);
  } catch (error) {
    throw new Error(`Error creating user_analytics table: ${error.message}`);
  }
};

export const trackEvent = async (userId, eventType, data = {}) => {
  try {
    const { productId, productUuid, quantity } = data;
    const uuid = uuidv4();

    let resolvedProductId = productId;
    if (!resolvedProductId && productUuid) {
      const product = await dbService.query(
        `SELECT id FROM products WHERE uuid = '${productUuid}'`
      );
      if (product?.length) resolvedProductId = product[0].id;
    }

    const result = await dbService.query(`
      INSERT INTO user_analytics (uuid, user_id, event_type, product_id, quantity)
      VALUES ('${uuid}', ${userId}, '${eventType}', ${
      resolvedProductId || "NULL"
    }, ${quantity || "NULL"})
    `);

    return result?.affectedRows > 0;
  } catch (error) {
    console.error(`Error tracking user event: ${error.message}`);
    return false;
  }
};

export const getUserAnalytics = async (userId, filters = {}) => {
  try {
    const { eventType, limit = 100, offset = 0 } = filters;

    let query = `
      SELECT ua.uuid, ua.event_type, p.uuid as product_uuid, p.name as product_name,
             ua.quantity, ua.created_at
      FROM user_analytics ua
      LEFT JOIN products p ON ua.product_id = p.id
      WHERE ua.user_id = ${userId}
    `;

    if (eventType) query += ` AND ua.event_type = '${eventType}'`;

    query += ` ORDER BY ua.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    return await dbService.query(query);
  } catch (error) {
    throw new Error(`Error fetching user analytics: ${error.message}`);
  }
};
