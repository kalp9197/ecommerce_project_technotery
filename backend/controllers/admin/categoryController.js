import { HTTP_STATUS } from "../../constants/index.js";
import { categoryModel } from "../../models/admin/index.js";

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryData = {
      ...req.body,
      created_by: userId,
    };

    const categoryUuid = await categoryModel.createCategory(categoryData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Category created successfully",
      data: { uuid: categoryUuid },
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to create category: ${error.message}`,
    });
  }
};

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;
    const categoryData = {
      ...req.body,
      updated_by: userId,
    };

    const result = await categoryModel.updateCategory(uuid, categoryData);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to update category: ${error.message}`,
    });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const result = await categoryModel.deleteCategory(uuid, userId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("has associated products")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to delete category: ${error.message}`,
    });
  }
};
