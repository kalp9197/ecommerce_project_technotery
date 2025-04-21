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
      ORDER BY p.created_at DESC
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

    // Validate required fields
    if (!p_cat_uuid) {
      throw new Error("Product category UUID is required");
    }
    if (!name) {
      throw new Error("Product name is required");
    }
    if (!price && price !== 0) {
      throw new Error("Product price is required");
    }

    const uuid = uuidv4();

    // Get category ID
    const categoryResult = await query(
      `SELECT id FROM product_categories WHERE uuid = ? AND is_active = 1`,
      [p_cat_uuid]
    );

    // Check if category exists
    if (!categoryResult || !categoryResult.length || !categoryResult[0].id) {
      throw new Error("Invalid or inactive product category");
    }

    const categoryId = categoryResult[0].id;

    // Use empty string if description is undefined
    const safeDescription = description || "";

    // Insert product with the retrieved category ID
    const result = await query(
      `INSERT INTO products (uuid, p_cat_id, name, description, price, is_active, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        uuid,
        categoryId,
        name,
        safeDescription,
        price,
        user_id || null,
        user_id || null,
      ]
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

    // Check if at least one field is provided
    if (
      !p_cat_uuid &&
      !name &&
      description === undefined &&
      price === undefined
    ) {
      throw new Error("No fields provided for update");
    }

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

    // Build the update SQL dynamically
    let updateSQL = "UPDATE products SET updated_at = NOW()";
    const params = [];

    if (p_cat_id !== null) {
      updateSQL += ", p_cat_id = ?";
      params.push(p_cat_id);
    }

    if (name !== undefined) {
      updateSQL += ", name = ?";
      params.push(name);
    }

    if (description !== undefined) {
      updateSQL += ", description = ?";
      params.push(description);
    }

    if (price !== undefined) {
      updateSQL += ", price = ?";
      params.push(price);
    }

    updateSQL += " WHERE uuid = ? AND is_active = 1";
    params.push(uuid);

    // Execute the update query
    const result = await query(updateSQL, params);

    if (result.affectedRows === 0) {
      // Check if the product exists
      const exists = await query("SELECT id FROM products WHERE uuid = ?", [
        uuid,
      ]);

      if (!exists || !exists.length) {
        throw new Error("Product not found");
      } else {
        // Product exists but might be inactive or no changes were made
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
