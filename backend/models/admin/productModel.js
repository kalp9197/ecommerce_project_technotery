import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Create a new product
export const createProduct = async (productData) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      category_uuid,
      created_by,
    } = productData;

    // Get category ID
    const categories = await dbService.query(
      `SELECT
          id
        FROM
          product_categories
        WHERE
          uuid = ? AND is_active = 1`,
      [category_uuid]
    );

    if (!categories?.length) {
      throw new Error("Category not found");
    }

    const categoryId = categories[0].id;
    const uuid = uuidv4();

    const result = await dbService.query(
      `INSERT INTO
          products (uuid, name, description, price, quantity, p_cat_id, created_by)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)`,
      [uuid, name, description, price, quantity, categoryId, created_by]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create product");
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

// Update a product
export const updateProductByUuid = async (uuid, productData) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      category_uuid,
      updated_by,
    } = productData;

    // Check if product exists
    const products = await dbService.query(
      `SELECT
          *
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!products?.length) {
      return false;
    }

    let categoryId = products[0].p_cat_id;

    // If category is being updated, get new category ID
    if (category_uuid) {
      const categories = await dbService.query(
        `SELECT
            id
          FROM
            product_categories
          WHERE
            uuid = ? AND is_active = 1`,
        [category_uuid]
      );

      if (!categories?.length) {
        throw new Error("Category not found");
      }

      categoryId = categories[0].id;
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }

    if (price !== undefined) {
      updateFields.push("price = ?");
      updateValues.push(price);
    }

    if (quantity !== undefined) {
      updateFields.push("quantity = ?");
      updateValues.push(quantity);
    }

    if (category_uuid) {
      updateFields.push("p_cat_id = ?");
      updateValues.push(categoryId);
    }

    updateFields.push("updated_by = ?");
    updateValues.push(updated_by);

    // Add UUID to values array
    updateValues.push(uuid);

    const result = await dbService.query(
      `UPDATE
          products
        SET
          ${updateFields.join(", ")}
        WHERE
          uuid = ? AND is_active = 1`,
      updateValues
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
};

// Delete a product
export const deleteProductByUuid = async (uuid, userId) => {
  try {
    // Check if product exists
    const products = await dbService.query(
      `SELECT
          *
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!products?.length) {
      return false;
    }

    // Soft delete product
    const result = await dbService.query(
      `UPDATE
          products
        SET
          is_active = 0,
          updated_by = ?
        WHERE
          uuid = ?`,
      [userId, uuid]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
};
