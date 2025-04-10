import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

export const getAllProducts = async () => {
  try {
    const sql = `
      SELECT p.*, pc.name as category_name
      FROM products p 
      JOIN product_categories pc ON p.p_cat_id = pc.id
      WHERE p.is_active = 1 AND pc.is_active = 1
    `;
    return await query(sql, []);
  } catch (error) {
    throw new Error(`Error fetching products: ${error.message}`);
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

export const createProduct = async (body, user_id) => {
  try {
    const { p_cat_uuid, name, description, price } = body;
    const uuid = uuidv4();

    // Get category ID
    const categoryResult = await query(
      `SELECT id FROM product_categories WHERE uuid = ? AND is_active = 1`,
      [p_cat_uuid]
    );

    // Check if category exists
    if (!categoryResult[0] || !categoryResult[0].id) {
      throw new Error("Invalid or inactive product category");
    }

    const categoryId = categoryResult[0].id;

    // Insert product with the retrieved category ID
    const result = await query(
      `INSERT INTO products (uuid, p_cat_id, name, description, price, is_active, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [uuid, categoryId, name, description, price, user_id, user_id]
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

      if (!categoryResult[0] || !categoryResult[0].id) {
        throw new Error("Invalid or inactive product category");
      }

      p_cat_id = categoryResult[0].id;
    }

    // Update product
    const result = await query(
      `UPDATE products p
       SET p.p_cat_id = COALESCE(?, p.p_cat_id), 
           p.name = COALESCE(?, p.name), 
           p.description = COALESCE(?, p.description), 
           p.price = COALESCE(?, p.price)
       WHERE p.uuid = ? AND p.is_active = 1`,
      [p_cat_id, name, description, price, uuid]
    );

    if (!result || result.affectedRows === 0) {
      throw new Error("Failed to update product");
    }

    return result;
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
