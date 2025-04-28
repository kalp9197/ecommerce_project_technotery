import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

export const getAllProducts = async (limit, offset) => {
  try {
    limit = Number(limit);
    offset = Number(offset);

    // Get paginated products with category info
    const products = await query(
      `
      SELECT 
        p.*, 
        pc.name as category_name,
        (SELECT pi.image_path 
         FROM product_images pi 
         WHERE pi.p_id = p.id AND pi.is_featured = 1 AND pi.is_active = 1 
         LIMIT 1) as featured_image
      FROM products p 
      JOIN product_categories pc ON p.p_cat_id = pc.id
      WHERE p.is_active = 1 AND pc.is_active = 1 
      ORDER BY p.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `
    );

    return {
      products,
    };
  } catch (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
};

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

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    // Start WHERE clause
    let where = `p.is_active = 1`;

    if (search.trim()) {
      where += ` AND (p.name LIKE '%${search.trim()}%' )`;
    }
    if (!isNaN(minPrice) && minPrice !== "") {
      where += ` AND p.price >= ${Number(minPrice)}`;
    }
    if (!isNaN(maxPrice) && maxPrice !== "") {
      where += ` AND p.price <= ${Number(maxPrice)}`;
    }

    // Validate orderBy and orderDir
    const allowedFields = ["name", "price", "created_at"];
    const orderField = allowedFields.includes(orderBy) ? orderBy : "name";
    const orderDirection = orderDir === "desc" ? "desc" : "asc";

    const sql = `
      SELECT p.*, pc.name AS category_name
      FROM products p
      JOIN product_categories pc ON p.p_cat_id = pc.id
      WHERE ${where} AND pc.is_active = 1
      ORDER BY p.${orderField} ${orderDirection}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const products = await query(sql);

    return {
      products,
      pagination: { page: pageNum, limit: limitNum },
    };
  } catch (err) {
    throw new Error(`Error searching products: ${err.message}`);
  }
};

export const getProductByUuid = async (uuid) => {
  try {
    const rows = await query(
      `
      SELECT 
        p.id AS product_id,
        p.uuid,
        p.name,
        p.description,
        p.price,
        pc.name AS category_name,
        pi.id AS image_id
      FROM products p
      JOIN product_categories pc ON p.p_cat_id = pc.id
      LEFT JOIN product_images pi ON pi.p_id = p.id AND pi.is_active = 1
      WHERE p.uuid = ? AND p.is_active = 1 AND pc.is_active = 1
      LIMIT 1
      `,
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

export const createProduct = async (body) => {
  try {
    const { p_cat_uuid, name, description, price, quantity } = body;
    const uuid = uuidv4();

    // Get category ID
    const categoryResult = await query(
      `SELECT id FROM product_categories WHERE uuid = ? AND is_active = 1`,
      [p_cat_uuid]
    );

    if (!categoryResult || !categoryResult.length || !categoryResult[0].id) {
      throw new Error("Invalid or inactive product category");
    }

    const categoryId = categoryResult[0].id;
    const safeDescription = description || "";

    // Insert product with the retrieved category ID
    const result = await query(
      `INSERT INTO products (uuid, p_cat_id, name, description, price, quantity, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [uuid, categoryId, name, safeDescription, price, quantity]
    );

    if (!result || result.affectedRows === 0) {
      throw new Error("Failed to create product");
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

export const updateProductByUuid = async (uuid, body) => {
  try {
    const { p_cat_uuid, name, description, price } = body;

    let p_cat_id = null;
    if (p_cat_uuid) {
      // Get category ID if provided
      const categoryResult = await query(
        `SELECT id FROM product_categories WHERE uuid = ? AND is_active = 1`,
        [p_cat_uuid]
      );

      if (!categoryResult || !categoryResult.length || !categoryResult[0].id) {
        throw new Error("Invalid or inactive product category");
      }

      p_cat_id = categoryResult[0].id;
    }

    // Execute the update query with all fields
    const result = await query(
      `UPDATE products 
       SET updated_at = NOW(),
           p_cat_id = COALESCE(?, p_cat_id),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price)
       WHERE uuid = ? AND is_active = 1`,
      [p_cat_id, name, description, price, uuid]
    );

    if (result.affectedRows === 0) {
      // Check if the product exists
      const exists = await query("SELECT id FROM products WHERE uuid = ?", [
        uuid,
      ]);

      if (!exists || !exists.length) {
        throw new Error("Product not found");
      } else {
        throw new Error(
          "No changes made to the product or product is inactive"
        );
      }
    }

    // Get updated product data
    const updatedProduct = await getProductByUuid(uuid);
    return {
      affectedRows: result.affectedRows,
      data: updatedProduct,
    };
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
};

// Soft delete product by UUID (mark as inactive)
export const deleteProductByUuid = async (uuid) => {
  try {
    const result = await query(
      `UPDATE products p
       SET p.is_active = 0
       WHERE p.uuid = ? 
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
