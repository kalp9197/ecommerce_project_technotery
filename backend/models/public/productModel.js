import { dbService } from "../../services/index.js";

// Create products table if it doesn't exist
export const ensureProductsTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      p_cat_id INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_by INT,
      updated_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (p_cat_id) REFERENCES product_categories(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )`);
  } catch (error) {
    throw new Error(`Error creating products table: ${error.message}`);
  }
};

// Get paginated list of active products
export const getAllProducts = async (limit, offset) => {
  try {
    limit = Number(limit);
    offset = Number(offset);

    const products = await dbService.query(
      `SELECT
          p.*,
          pc.name as category_name,
          (SELECT pi.image_path
            FROM product_images pi
            WHERE pi.p_id = p.id AND pi.is_featured = 1 AND pi.is_active = 1
            LIMIT 1) as featured_image
        FROM
          products p
        JOIN
          product_categories pc ON p.p_cat_id = pc.id
        WHERE
          p.is_active = 1 AND pc.is_active = 1
        ORDER BY
          p.id ASC
        LIMIT
          ${limit}
        OFFSET
          ${offset}`
    );

    return { products };
  } catch (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
};

// Get product by UUID
export const getProductByUuid = async (uuid) => {
  try {
    const products = await dbService.query(
      `SELECT
          p.*,
          pc.name as category_name,
          (SELECT pi.image_path
            FROM product_images pi
            WHERE pi.p_id = p.id AND pi.is_featured = 1 AND pi.is_active = 1
            LIMIT 1) as featured_image
        FROM
          products p
        JOIN
          product_categories pc ON p.p_cat_id = pc.id
        WHERE
          p.uuid = ? AND p.is_active = 1 AND pc.is_active = 1`,
      [uuid]
    );

    return products?.length ? products[0] : null;
  } catch (error) {
    throw new Error(`Error fetching product: ${error.message}`);
  }
};

// Search products by name or description
export const searchProducts = async (query, category, limit, offset) => {
  try {
    let sql = `
      SELECT
        p.*,
        pc.name as category_name,
        (SELECT pi.image_path
          FROM product_images pi
          WHERE pi.p_id = p.id AND pi.is_featured = 1 AND pi.is_active = 1
          LIMIT 1) as featured_image
      FROM
        products p
      JOIN
        product_categories pc ON p.p_cat_id = pc.id
      WHERE
        p.is_active = 1 AND pc.is_active = 1
    `;

    const params = [];

    if (query) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    if (category) {
      sql += ` AND pc.uuid = ?`;
      params.push(category);
    }

    sql += `
      ORDER BY
        p.id ASC
      LIMIT
        ${limit}
      OFFSET
        ${offset}
    `;

    const products = await dbService.query(sql, params);
    return { products };
  } catch (error) {
    throw new Error(`Error searching products: ${error.message}`);
  }
};

// Get product images
export const getImagesByProductUuid = async (productUuid) => {
  try {
    const images = await dbService.query(
      `SELECT
          pi.*
        FROM
          product_images pi
        JOIN
          products p ON p.id = pi.p_id
        WHERE
          p.uuid = ? AND p.is_active = 1`,
      [productUuid]
    );
    return images || [];
  } catch (error) {
    throw new Error(`Error fetching product images: ${error.message}`);
  }
};
