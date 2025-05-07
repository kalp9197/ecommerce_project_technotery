import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";

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

// Get a single category by UUID
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
    return result;
  } catch (error) {
    throw new Error(`Error fetching category: ${error.message}`);
  }
};

// Create a new product category
export const createCategory = async (categoryData, userId) => {
  try {
    const { name } = categoryData;
    const uuid = uuidv4();

    // Check for duplicate category names (case-insensitive)
    const existingCategory = await dbService.query(
      `SELECT
          id
        FROM
          product_categories
        WHERE
          LOWER(name) = LOWER(?) AND is_active = 1`,
      [name]
    );

    if (existingCategory?.length > 0) {
      throw new Error("Category with this name already exists");
    }

    const result = await dbService.query(
      `INSERT INTO
          product_categories (uuid, name, is_active, created_by, updated_by)
        VALUES
          (?, ?, 1, ?, ?)`,
      [uuid, name, userId || null, userId || null]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create category");
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error creating category: ${error.message}`);
  }
};

// Update existing product category
export const updateCategoryByUuid = async (uuid, categoryData, userId) => {
  try {
    const { name } = categoryData;

    // Verify category exists and is active
    const existingCategory = await dbService.query(
      `SELECT
          id
        FROM
          product_categories
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!existingCategory?.length) {
      throw new Error("Category not found or inactive");
    }

    // Check for name conflicts with other categories (case-insensitive)
    const duplicateCheck = await dbService.query(
      `SELECT
          id
        FROM
          product_categories
        WHERE
          LOWER(name) = LOWER(?)
          AND uuid != ?
          AND is_active = 1`,
      [name, uuid]
    );

    if (duplicateCheck?.length > 0) {
      throw new Error("Category with this name already exists");
    }

    const result = await dbService.query(
      `UPDATE
          product_categories
        SET
          name = ?,
          updated_by = ?
        WHERE
          uuid = ? AND is_active = 1`,
      [name, userId || null, uuid]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to update category");
    }

    return result;
  } catch (error) {
    throw new Error(`Error updating category: ${error.message}`);
  }
};

// Soft-delete a product category (if no active products)
export const deleteCategoryByUuid = async (uuid) => {
  try {
    // Count active products in the category
    const categoryCheck = await dbService.query(
      `SELECT
        c.id,
        (SELECT COUNT(*) FROM products p WHERE p.p_cat_id = c.id AND p.is_active = 1) as product_count
       FROM
         product_categories c
       WHERE
         c.uuid = ? AND c.is_active = 1`,
      [uuid]
    );

    if (!categoryCheck?.length) {
      throw new Error("Category not found or already inactive");
    }

    // Prevent deletion if category contains active products
    if (categoryCheck[0].product_count > 0) {
      throw new Error(
        `Cannot delete category with active products. Please deactivate all ${categoryCheck[0].product_count} product(s) in this category first.`
      );
    }

    const result = await dbService.query(
      `UPDATE
          product_categories
        SET
          is_active = 0
        WHERE
          id = ?`,
      [categoryCheck[0].id]
    );

    if (!result || result.affectedRows === 0) {
      throw new Error("Failed to deactivate category");
    }

    return {
      categoryId: categoryCheck[0].id,
      productsDeactivated: 0,
    };
  } catch (error) {
    throw new Error(`Error deleting category: ${error.message}`);
  }
};
