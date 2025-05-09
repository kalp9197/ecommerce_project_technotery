import { dbService } from "../../services/index.js";

// Create product categories table if it doesn't exist
export const ensureProductCategoriesTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS product_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_by INT,
      updated_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )`);
  } catch (error) {
    throw new Error(
      `Error creating product_categories table: ${error.message}`
    );
  }
};

// Get paginated list of active product categories
export const getAllCategories = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;
    const result = await dbService.query(
      `SELECT
          *
        FROM
          product_categories
        WHERE
          is_active = 1
        ORDER BY
          id ASC
        LIMIT
          ${limit}
        OFFSET
          ${offset}`
    );
    return result || [];
  } catch (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
};

// Get category by UUID
export const getCategoryByUuid = async (uuid) => {
  try {
    const result = await dbService.query(
      `SELECT
          *
        FROM
          product_categories
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching category: ${error.message}`);
  }
};
