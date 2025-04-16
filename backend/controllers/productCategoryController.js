import * as categoryModel from "../models/productCategoryModel.js";
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get categories: ${error.message}`,
    });
  }
};

export const getCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const categories = await categoryModel.getCategoryByUuid(uuid);

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.status(200).json({
      success: true,
      data: categories[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get category: ${error.message}`,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Create and fetch the new category
    const categoryUuid = await categoryModel.createCategory({ name }, userId);

    const categories = await categoryModel.getCategoryByUuid(categoryUuid);
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(201).json({
      success: true,
      data: categories[0],
    });
  } catch (error) {
    // Check for specific error cases
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: `Failed to create category: ${error.message}`,
    });
  }
};

export const updateCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { name, is_active } = req.body;
    const userId = req.user.id;

    // Verify category exists
    const categoriesCheck = await categoryModel.getCategoryByUuid(uuid);
    if (!categoriesCheck || categoriesCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await categoryModel.updateCategoryByUuid(uuid, { name, is_active }, userId);

    // Get updated data
    const updatedCategories = await categoryModel.getCategoryByUuid(uuid);

    res.status(200).json({
      success: true,
      data: updatedCategories[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update category: ${error.message}`,
    });
  }
};

export const deleteCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Verify category exists
    const categories = await categoryModel.getCategoryByUuid(uuid);
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const originalCategory = categories[0];
    const result = await categoryModel.deleteCategoryByUuid(uuid);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: {
        deleted_category: originalCategory,
      },
    });
  } catch (error) {
    // Special handling for categories with products
    if (error.message.includes("deactivate all")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: `Failed to delete category: ${error.message}`,
    });
  }
};
