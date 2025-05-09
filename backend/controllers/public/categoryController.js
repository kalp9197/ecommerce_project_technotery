import { HTTP_STATUS } from "../../constants/index.js";
import { categoryModel } from "../../models/public/index.js";

export const getAllCategories = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid page or limit value",
      });
    }

    const categories = await categoryModel.getAllCategories(page, limit);
    if (categories.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No categories found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get categories: ${error.message}`,
    });
  }
};

export const getCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const category = await categoryModel.getCategoryByUuid(uuid);

    if (!category) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get category: ${error.message}`,
    });
  }
};
