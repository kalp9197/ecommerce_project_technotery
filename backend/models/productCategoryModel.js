import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

export const getAllCategories = async () => {
  try {
    return await query(
      "SELECT * FROM product_categories WHERE is_active = 1",
      [],
    );
  } catch (error) {
    throw new Error(`Error fetching categories: ${error.message}`);
  }
};

export const getCategoryByUuid = async (uuid) => {
  try {
    const result = await query(
      "SELECT * FROM product_categories WHERE uuid = ? AND is_active = 1",
      [uuid],
    );
    return result?.[0] || null;
  } catch (error) {
    throw new Error(`Error fetching category: ${error.message}`);
  }
};

export const createCategory = async (categoryData) => {
  try {
    const { name } = categoryData;
    const uuid = uuidv4();

    // Check for duplicate and create in one query
    const result = await query(
      `INSERT INTO product_categories (uuid, name, is_active)
       SELECT ?, ?, 1
       WHERE NOT EXISTS (
         SELECT 1 FROM product_categories 
         WHERE LOWER(name) = LOWER(?) AND is_active = 1
       )`,
      [uuid, name.toLowerCase(), name],
    );

    if (!result?.affectedRows) {
      throw new Error(
        "Category with this name already exists or failed to create",
      );
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error creating category: ${error.message}`);
  }
};

export const updateCategoryByUuid = async (uuid, categoryData) => {
  try {
    const { name } = categoryData;

    // Update and check for duplicates in one query
    const result = await query(
      `UPDATE product_categories c
       SET c.name = ?
       WHERE c.uuid = ? 
       AND c.is_active = 1
       AND NOT EXISTS (
         SELECT 1 FROM product_categories 
         WHERE LOWER(name) = LOWER(?) 
         AND uuid != ? 
         AND is_active = 1
       )`,
      [name?.toLowerCase(), uuid, name, uuid],
    );

    if (!result?.affectedRows) {
      throw new Error(
        "Category not found, name already exists, or update failed",
      );
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
      [uuid],
    );

    if (!categoryCheck || categoryCheck.length === 0) {
      throw new Error("Category not found or already inactive");
    }

    // Check if there are active products in this category
    if (categoryCheck[0].product_count > 0) {
      throw new Error(
        `Cannot delete category with active products. Please deactivate all ${categoryCheck[0].product_count} product(s) in this category first.`,
      );
    }

    // Now deactivate the category since it has no active products
    const result = await query(
      "UPDATE product_categories SET is_active = 0 WHERE id = ?",
      [categoryCheck[0].id],
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
