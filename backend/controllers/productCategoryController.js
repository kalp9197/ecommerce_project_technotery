import { HTTP_STATUS } from "../constants/index.js";
import * as categoryModel from "../models/productCategoryModel.js";

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
      message: `An error occurred while fetching categories : ${error.message}`,
    });
  }
};

export const getCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const categories = await categoryModel.getCategoryByUuid(uuid);

    if (!categories?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: categories[0],
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while fetching category : ${error.message}`,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const categoryUuid = await categoryModel.createCategory({ name }, userId);

    if (!categoryUuid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while creating category",
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      msg: "Category created successfully",
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while creating category : ${error.message}`,
    });
  }
};

export const updateCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { name, is_active } = req.body;
    const userId = req.user.id;

    const categoriesCheck = await categoryModel.getCategoryByUuid(uuid);
    if (!categoriesCheck?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    const updatedCategories = await categoryModel.updateCategoryByUuid(
      uuid,
      { name, is_active },
      userId
    );

    if (!updatedCategories?.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while updating category",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      msg: "Category updated successfully",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while updating category : ${error.message}`,
    });
  }
};

export const deleteCategoryByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;

    const categories = await categoryModel.getCategoryByUuid(uuid);
    if (!categories?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Category not found",
      });
    }

    const result = await categoryModel.deleteCategoryByUuid(uuid);
    if (!result) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while deleting category",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("deactivate all")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while deleting category : ${error.message}`,
    });
  }
};
