import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

export const getAllCategories = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM product_categories WHERE is_active = 1 ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`
    );

    // Return an empty array instead of null if no categories are found
    return result || [];
  } catch (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
};

export const getCategoryByUuid = async (uuid) => {
  try {
    const result = await query(
      "SELECT * FROM product_categories WHERE uuid = ? AND is_active = 1",
      [uuid]
    );
    return result;
  } catch (error) {
    throw new Error(`Error fetching category: ${error.message}`);
  }
};

export const createCategory = async (categoryData, userId) => {
  try {
    const { name } = categoryData;
    const uuid = uuidv4();

    // Check for duplicate
    const existingCategory = await query(
      `SELECT id FROM product_categories WHERE LOWER(name) = LOWER(?) AND is_active = 1`,
      [name]
    );

    if (existingCategory && existingCategory.length > 0) {
      throw new Error("Category with this name already exists");
    }

    // Create category with user ID (passing null if userId is undefined)
    const result = await query(
      `INSERT INTO product_categories (uuid, name, is_active, created_by, updated_by)
       VALUES (?, ?, 1, ?, ?)`,
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

export const updateCategoryByUuid = async (uuid, categoryData, userId) => {
  try {
    const { name } = categoryData;

    // First, check if the category exists
    const existingCategory = await query(
      `SELECT id FROM product_categories WHERE uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!existingCategory || existingCategory.length === 0) {
      throw new Error("Category not found or inactive");
    }

    // Check for duplicate name (excluding the current category)
    const duplicateCheck = await query(
      `SELECT id FROM product_categories 
       WHERE LOWER(name) = LOWER(?) 
       AND uuid != ? 
       AND is_active = 1`,
      [name, uuid]
    );

    if (duplicateCheck && duplicateCheck.length > 0) {
      throw new Error("Category with this name already exists");
    }

    // Update the category (passing null if userId is undefined)
    const result = await query(
      `UPDATE product_categories 
       SET name = ?, updated_by = ?
       WHERE uuid = ? AND is_active = 1`,
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

export const deleteCategoryByUuid = async (uuid) => {
  try {
    // First find the category and check for associated products
    const categoryCheck = await query(
      `SELECT 
        c.id, 
        (SELECT COUNT(*) FROM products p WHERE p.p_cat_id = c.id AND p.is_active = 1) as product_count
       FROM product_categories c 
       WHERE c.uuid = ? AND c.is_active = 1`,
      [uuid]
    );

    if (!categoryCheck || categoryCheck.length === 0) {
      throw new Error("Category not found or already inactive");
    }

    // Check if there are active products in this category
    if (categoryCheck[0].product_count > 0) {
      throw new Error(
        `Cannot delete category with active products. Please deactivate all ${categoryCheck[0].product_count} product(s) in this category first.`
      );
    }

    // Now deactivate the category since it has no active products
    const result = await query(
      "UPDATE product_categories SET is_active = 0 WHERE id = ?",
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
