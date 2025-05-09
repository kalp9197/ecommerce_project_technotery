import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Create a new category
export const createCategory = async (categoryData) => {
  try {
    const { name, description, created_by } = categoryData;

    // Check if category with same name already exists
    const existingCategories = await dbService.query(
      `SELECT
          *
        FROM
          product_categories
        WHERE
          name = ? AND is_active = 1`,
      [name]
    );

    if (existingCategories?.length) {
      throw new Error("Category with this name already exists");
    }

    const uuid = uuidv4();

    const result = await dbService.query(
      `INSERT INTO
          product_categories (uuid, name, description, created_by)
        VALUES
          (?, ?, ?, ?)`,
      [uuid, name, description, created_by]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create category");
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error creating category: ${error.message}`);
  }
};

// Update a category
export const updateCategory = async (uuid, categoryData) => {
  try {
    const { name, description, updated_by } = categoryData;

    // Check if category exists
    const categories = await dbService.query(
      `SELECT
          *
        FROM
          product_categories
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!categories?.length) {
      return false;
    }

    // If name is being updated, check if it conflicts with existing category
    if (name && name !== categories[0].name) {
      const existingCategories = await dbService.query(
        `SELECT
            *
          FROM
            product_categories
          WHERE
            name = ? AND is_active = 1 AND uuid != ?`,
        [name, uuid]
      );

      if (existingCategories?.length) {
        throw new Error("Category with this name already exists");
      }
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

    updateFields.push("updated_by = ?");
    updateValues.push(updated_by);

    // Add UUID to values array
    updateValues.push(uuid);

    const result = await dbService.query(
      `UPDATE
          product_categories
        SET
          ${updateFields.join(", ")}
        WHERE
          uuid = ? AND is_active = 1`,
      updateValues
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error updating category: ${error.message}`);
  }
};

// Delete a category
export const deleteCategory = async (uuid, userId) => {
  try {
    // Check if category exists
    const categories = await dbService.query(
      `SELECT
          *
        FROM
          product_categories
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!categories?.length) {
      return false;
    }

    // Check if category has associated products
    const products = await dbService.query(
      `SELECT
          COUNT(*) as count
        FROM
          products
        WHERE
          p_cat_id = ? AND is_active = 1`,
      [categories[0].id]
    );

    if (products[0].count > 0) {
      throw new Error("Cannot delete category that has associated products");
    }

    // Soft delete category
    const result = await dbService.query(
      `UPDATE
          product_categories
        SET
          is_active = 0,
          updated_by = ?
        WHERE
          uuid = ?`,
      [userId, uuid]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error deleting category: ${error.message}`);
  }
};
