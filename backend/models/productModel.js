import { dbService } from "../services/index.js";

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

// Search products with filtering options
export const searchProducts = async (params) => {
  try {
    const {
      search = "",
      minPrice,
      maxPrice,
      orderBy = "name",
      orderDir = "asc",
      page = 1,
      limit = 10,
    } = params;

    // Normalize and sanitize input values
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    let where = `p.is_active = 1`;

    // Build dynamic WHERE clause based on search parameters
    if (search.trim()) {
      where += ` AND (p.name LIKE '%${search.trim()}%' )`;
    }
    if (!isNaN(minPrice) && minPrice !== "") {
      where += ` AND p.price >= ${Number(minPrice)}`;
    }
    if (!isNaN(maxPrice) && maxPrice !== "") {
      where += ` AND p.price <= ${Number(maxPrice)}`;
    }

    // Prevent SQL injection in ORDER BY clause
    const allowedFields = ["name", "price", "created_at"];
    const orderField = allowedFields.includes(orderBy) ? orderBy : "name";
    const orderDirection = orderDir === "desc" ? "desc" : "asc";

    const sql = `
      SELECT
          p.*, pc.name AS category_name
        FROM
          products p
        JOIN
          product_categories pc ON p.p_cat_id = pc.id
        WHERE
          ${where} AND pc.is_active = 1
        ORDER BY
          p.${orderField} ${orderDirection}
        LIMIT
          ${limitNum}
        OFFSET
          ${offset}`;

    const products = await dbService.query(sql);

    return {
      products,
      pagination: { page: pageNum, limit: limitNum },
    };
  } catch (err) {
    throw new Error(`Error searching products: ${err.message}`);
  }
};

// Get single product by UUID
export const getProductByUuid = async (uuid) => {
  try {
    const rows = await dbService.query(
      `SELECT
          p.id AS product_id,
          p.uuid,
          p.name,
          p.description,
          p.price,
          pc.name AS category_name,
          pi.id AS image_id
        FROM
          products p
        JOIN
          product_categories pc ON p.p_cat_id = pc.id
        LEFT JOIN
          product_images pi ON pi.p_id = p.id AND pi.is_active = 1
        WHERE
          p.uuid = ? AND p.is_active = 1 AND pc.is_active = 1
        LIMIT
          1`,
      [uuid]
    );

    if (!rows.length) throw new Error("Product not found");

    const row = rows[0];
    return {
      id: row.product_id,
      uuid: row.uuid,
      name: row.name,
      description: row.description,
      price: row.price,
      category_name: row.category_name,
    };
  } catch (error) {
    throw new Error(`Error fetching product: ${error.message}`);
  }
};

// Create new product record
export const createProduct = async (productData) => {
  const { sku, name, category, price, quantity, images } = productData;

  const result = await dbService.query(
    `INSERT INTO
        products (sku, name, category, price, quantity, images)
      VALUES
        (?, ?, ?, ?, ?, ?)`,
    [sku, name, category, price, quantity, JSON.stringify(images)]
  );

  return {
    id: result.insertId,
    sku,
    name,
    category,
    price,
    quantity,
    images,
  };
};

// Update existing product data
export const updateProductByUuid = async (uuid, body) => {
  try {
    const { p_cat_uuid, name, description, price } = body;

    let p_cat_id = null;
    // Get category ID from UUID if provided
    if (p_cat_uuid) {
      const categoryResult = await dbService.query(
        `SELECT
            id
          FROM
            product_categories
          WHERE
            uuid = ? AND is_active = 1`,
        [p_cat_uuid]
      );

      if (!categoryResult?.length || !categoryResult[0].id) {
        throw new Error("Invalid or inactive product category");
      }

      p_cat_id = categoryResult[0].id;
    }

    // Update only fields that were provided using COALESCE
    const result = await dbService.query(
      `UPDATE
          products
        SET
          updated_at = NOW(),
          p_cat_id = COALESCE(?, p_cat_id),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price)
        WHERE
          uuid = ? AND is_active = 1`,
      [p_cat_id, name, description, price, uuid]
    );

    if (result.affectedRows === 0) {
      const exists = await dbService.query(
        `SELECT
            id
          FROM
            products
          WHERE
            uuid = ?`,
        [uuid]
      );

      if (!exists?.length) {
        throw new Error("Product not found");
      } else {
        throw new Error(
          "No changes made to the product or product is inactive"
        );
      }
    }

    const updatedProduct = await getProductByUuid(uuid);
    return {
      affectedRows: result.affectedRows,
      data: updatedProduct,
    };
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
};

// Soft-delete product (set inactive)
export const deleteProductByUuid = async (uuid) => {
  try {
    const result = await dbService.query(
      `UPDATE
          products p
        SET
          p.is_active = 0
        WHERE
          p.uuid = ?
          AND p.is_active = 1`,
      [uuid]
    );

    if (!result || result.affectedRows === 0) {
      throw new Error("Product not found or already inactive");
    }

    return result;
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
};

// Get product by SKU (used for inventory lookup)
export const getProductBySKU = async (sku) => {
  try {
    const results = await dbService.query(
      `SELECT
          *
        FROM
          products
        WHERE
          sku = ?`,
      [sku]
    );
    if (results.length === 0) {
      return null;
    }

    // Parse images JSON string to array
    const product = results[0];
    product.images = JSON.parse(product.images || "[]");

    return product;
  } catch (error) {
    throw new Error(`Error fetching product by SKU: ${error.message}`);
  }
};

// Create multiple product records in succession
export const bulkCreateProducts = async (productsData) => {
  try {
    const createdProducts = [];

    for (const productData of productsData) {
      const result = await createProduct(productData);
      createdProducts.push(result);
    }

    return createdProducts;
  } catch (error) {
    throw new Error(`Error creating products: ${error.message}`);
  }
};

// Initialize products table if not exists
export const ensureProductsTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL,
      images TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
  } catch (error) {
    throw new Error(`Error creating products table: ${error.message}`);
  }
};
