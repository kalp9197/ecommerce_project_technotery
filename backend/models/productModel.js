import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";
import {
  redis,
  CACHE_TTL,
  CACHE_KEYS,
  getVersionedKey,
  invalidateAllCaches,
} from "../config/index.js";

// Manually refresh cache - can be called from API to force refresh
export const refreshProductCache = async () => {
  try {
    await invalidateAllCaches();
    return { success: true, message: "Product cache refreshed successfully" };
  } catch (error) {
    return {
      success: false,
      message: `Failed to refresh cache: ${error.message}`,
    };
  }
};

// Get paginated list of active products
export const getAllProducts = async (limit, offset) => {
  try {
    limit = Number(limit);
    offset = Number(offset);
    let fromCache = false;

    // Check cache for first page with 8 products
    if (limit === 8 && offset === 0) {
      const cacheKey = await getVersionedKey(CACHE_KEYS.PRODUCTS_PAGE_1);
      const cachedProducts = await redis.get(cacheKey);
      if (cachedProducts) {
        fromCache = true;
        return { products: cachedProducts, fromCache };
      }
    }

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
          p.is_featured DESC,
          p.id ASC
        LIMIT
          ${limit}
        OFFSET
          ${offset}`
    );

    // Convert is_featured from 0/1 to boolean
    const formattedProducts = products.map((product) => ({
      ...product,
      is_featured: !!product.is_featured,
    }));

    // Cache first page results (8 products)
    if (limit === 8 && offset === 0) {
      const cacheKey = await getVersionedKey(CACHE_KEYS.PRODUCTS_PAGE_1);
      await redis.set(cacheKey, formattedProducts, { ex: CACHE_TTL });
    }

    return { products: formattedProducts, fromCache };
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
      where += ` AND (p.name LIKE '%${search.trim()}%' OR p.sku LIKE '%${search.trim()}%')`;
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
          p.is_featured DESC,
          p.${orderField} ${orderDirection}
        LIMIT
          ${limitNum}
        OFFSET
          ${offset}`;

    const products = await dbService.query(sql);

    // Convert is_featured from 0/1 to boolean
    const formattedProducts = products.map((product) => ({
      ...product,
      is_featured: !!product.is_featured,
    }));

    return {
      products: formattedProducts,
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
          p.sku,
          p.description,
          p.price,
          p.is_featured,
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
      sku: row.sku,
      description: row.description,
      price: row.price,
      is_featured: !!row.is_featured,
      category_name: row.category_name,
    };
  } catch (error) {
    throw new Error(`Error fetching product: ${error.message}`);
  }
};

// Create new product record
export const createProduct = async (productData, userId) => {
  try {
    const {
      p_cat_uuid,
      name,
      sku,
      description,
      price,
      quantity = 0,
      is_featured = false,
    } = productData;
    const uuid = uuidv4();

    // Get category ID from UUID
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

    const p_cat_id = categoryResult[0].id;

    // Insert new product
    const result = await dbService.query(
      `INSERT INTO
          products (uuid, p_cat_id, name, sku, description, price, quantity, is_featured, is_active, created_by, updated_by)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        uuid,
        p_cat_id,
        name,
        sku || null,
        description || "",
        price,
        quantity,
        is_featured ? 1 : 0,
        userId,
        userId,
      ]
    );

    if (!result?.insertId) {
      throw new Error("Failed to create product");
    }

    // Invalidate all caches to ensure fresh data
    await invalidateAllCaches();

    return uuid;
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

// Update existing product data
export const updateProductByUuid = async (uuid, body, userId) => {
  try {
    const { p_cat_uuid, name, sku, description, price, is_featured } = body;

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

    // Prepare is_featured value for SQL
    let isFeaturedValue = null;
    if (is_featured !== undefined) {
      isFeaturedValue = is_featured ? 1 : 0;
    }

    // Update only fields that were provided using COALESCE
    const result = await dbService.query(
      `UPDATE
          products
        SET
          p_cat_id = COALESCE(?, p_cat_id),
          name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          is_featured = COALESCE(?, is_featured),
          updated_by = ?,
          updated_at = NOW()
        WHERE
          uuid = ? AND is_active = 1`,
      [
        p_cat_id,
        name,
        sku || null,
        description,
        price,
        isFeaturedValue,
        userId,
        uuid,
      ]
    );

    // Invalidate all caches to ensure fresh data
    await invalidateAllCaches();

    return result;
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
};

// Soft-delete product (set inactive)
export const deleteProductByUuid = async (uuid, userId) => {
  try {
    // Check if product has active images
    const productImages = await dbService.query(
      `SELECT
          COUNT(*) as image_count
        FROM
          product_images pi
        JOIN
          products p ON pi.p_id = p.id
        WHERE
          p.uuid = ? AND pi.is_active = 1`,
      [uuid]
    );

    if (productImages[0].image_count > 0) {
      throw new Error("Product has active images. Please delete them first.");
    }

    // Set product as inactive
    const result = await dbService.query(
      `UPDATE
          products
        SET
          is_active = 0,
          updated_by = ?,
          updated_at = NOW()
        WHERE
          uuid = ? AND is_active = 1`,
      [userId, uuid]
    );

    // Invalidate all caches to ensure fresh data
    await invalidateAllCaches();

    return result;
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
};

// Get product by name (used for inventory lookup)
export const getProductByName = async (name) => {
  try {
    const results = await dbService.query(
      `SELECT
          p.*,
          pc.name as category_name
        FROM
          products p
        JOIN
          product_categories pc ON p.p_cat_id = pc.id
        WHERE
          p.name = ? AND p.is_active = 1`,
      [name]
    );

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    throw new Error(`Error fetching product by name: ${error.message}`);
  }
};

// Create multiple product records in succession
export const bulkCreateProducts = async (productsData, userId) => {
  try {
    const createdProductUuids = [];

    for (const productData of productsData) {
      const uuid = await createProduct(productData, userId);
      createdProductUuids.push(uuid);
    }

    return createdProductUuids;
  } catch (error) {
    throw new Error(`Error creating products: ${error.message}`);
  }
};

// Get products by category UUID
export const getProductsByCategory = async (categoryUuid, limit, offset) => {
  try {
    limit = Number(limit);
    offset = Number(offset);

    // First, verify the category exists and is active
    const categoryResult = await dbService.query(`
      SELECT
        id
      FROM
        product_categories
      WHERE
        uuid = '${categoryUuid}' AND is_active = 1
    `);

    if (!categoryResult?.length || !categoryResult[0].id) {
      throw new Error("Invalid or inactive product category");
    }

    const categoryId = categoryResult[0].id;

    // Get products for this category
    const products = await dbService.query(`
      SELECT
        p.*,
        pc.name as category_name,
        pc.uuid as category_uuid,
        (SELECT pi.image_path
          FROM product_images pi
          WHERE pi.p_id = p.id AND pi.is_featured = 1 AND pi.is_active = 1
          LIMIT 1) as featured_image
      FROM
        products p
      JOIN
        product_categories pc ON p.p_cat_id = pc.id
      WHERE
        p.is_active = 1 AND pc.is_active = 1 AND p.p_cat_id = ${categoryId}
      ORDER BY
        p.is_featured DESC,
        p.id ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    // Convert is_featured from 0/1 to boolean
    const formattedProducts = products.map((product) => ({
      ...product,
      is_featured: !!product.is_featured,
    }));

    return {
      products: formattedProducts,
    };
  } catch (error) {
    throw new Error(`Error fetching products by category: ${error.message}`);
  }
};

// Get recommended products based on category and price range
export const getRecommendedProducts = async (productUuid, limit = 4) => {
  try {
    // First, get the current product's details to use for recommendations
    const product = await getProductByUuid(productUuid);

    if (!product) {
      throw new Error("Product not found");
    }

    // Get the product's category and price for recommendation criteria
    const productDetails = await dbService.query(`
      SELECT
        p.id,
        p.p_cat_id,
        p.price,
        pc.name as category_name
      FROM
        products p
      JOIN
        product_categories pc ON p.p_cat_id = pc.id
      WHERE
        p.uuid = '${productUuid}' AND p.is_active = 1
    `);

    if (!productDetails.length) {
      throw new Error("Product details not found");
    }

    const { p_cat_id, price } = productDetails[0];

    // Calculate price range (±20% of the current product's price)
    const minPrice = parseFloat(price) * 0.8;
    const maxPrice = parseFloat(price) * 1.2;

    // Get similar products in the same category with similar price range
    // Exclude the current product
    const recommendedProducts = await dbService.query(`
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
        p.is_active = 1
        AND pc.is_active = 1
        AND p.uuid != '${productUuid}'
        AND (
          p.p_cat_id = ${p_cat_id}  -- Same category
          OR (p.price BETWEEN ${minPrice} AND ${maxPrice})  -- Similar price range
        )
      ORDER BY
        p.is_featured DESC,  -- Prioritize featured products
        CASE
          WHEN p.p_cat_id = ${p_cat_id} THEN 0  -- Prioritize same category
          ELSE 1
        END,
        ABS(p.price - ${price})  -- Sort by price similarity
      LIMIT ${limit}
    `);

    // Convert is_featured from 0/1 to boolean
    const formattedRecommendedProducts = recommendedProducts.map((product) => ({
      ...product,
      is_featured: !!product.is_featured,
    }));

    return { recommendedProducts: formattedRecommendedProducts };
  } catch (error) {
    throw new Error(`Error fetching recommended products: ${error.message}`);
  }
};

// Initialize products table if not exists
export const ensureProductsTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS products (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      uuid        VARCHAR(36) NOT NULL UNIQUE,
      p_cat_id    INT         NOT NULL,
      name        VARCHAR(100) NOT NULL,
      sku         VARCHAR(50)  UNIQUE,
      description VARCHAR(255),
      price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      quantity    INT           NOT NULL DEFAULT 0,
      is_featured BOOLEAN       NOT NULL DEFAULT FALSE,
      is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
      created_by  INT,
      updated_by  INT,
      created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (p_cat_id)   REFERENCES product_categories(id) ON DELETE CASCADE
    )`);

    // Check if is_featured column exists, if not add it
    const columns = await dbService.query(`
      SHOW COLUMNS FROM products LIKE 'is_featured'
    `);

    if (columns.length === 0) {
      await dbService.query(`
        ALTER TABLE products
        ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE
        AFTER quantity
      `);
    }

    // Check if sku column exists, if not add it
    const skuColumn = await dbService.query(`
      SHOW COLUMNS FROM products LIKE 'sku'
    `);

    if (skuColumn.length === 0) {
      await dbService.query(`
        ALTER TABLE products
        ADD COLUMN sku VARCHAR(50) UNIQUE
        AFTER name
      `);
    }
  } catch (error) {
    throw new Error(`Error creating products table: ${error.message}`);
  }
};
