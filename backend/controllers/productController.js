import { HTTP_STATUS } from "../constants/index.js";
import * as productModel from "../models/productModel.js";

// Get paginated product list
export const getProducts = async (req, res) => {
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

    const offset = (page - 1) * limit;
    const result = await productModel.getAllProducts(limit, offset);

    if (!result.products?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No products found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Products fetched successfully",
      data: result.products,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while fetching products",
    });
  }
};

// Search products with filters
export const searchProducts = async (req, res) => {
  try {
    const result = await productModel.searchProducts(req.query);

    if (!result.products?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No products found matching your criteria",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Products fetched successfully",
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message:
        error.message || "An error occurred while searching for products",
    });
  }
};

// Get product by ID
export const getProductByUUID = async (req, res) => {
  try {
    const product = await productModel.getProductByUuid(req.params.uuid);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(HTTP_STATUS.OK).json({ success: true, data: product });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while fetching the product",
    });
  }
};

// Create new product
export const addProduct = async (req, res) => {
  try {
    const productUuid = await productModel.createProduct(
      req.body,
      req.user?.id
    );

    if (!productUuid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Failed to create product",
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Product created successfully",
      data: { uuid: productUuid },
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
      message: error.message || "An error occurred while creating the product",
    });
  }
};

// Update existing product
export const updateProductByUUID = async (req, res) => {
  try {
    const updatedProduct = await productModel.updateProductByUuid(
      req.params.uuid,
      req.body
    );

    if (!updatedProduct || updatedProduct.affectedRows === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found or no changes made",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product updated successfully",
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
      message: error.message || "An error occurred while updating the product",
    });
  }
};

// Delete product
export const removeProductByUUID = async (req, res) => {
  try {
    const deletedProduct = await productModel.deleteProductByUuid(
      req.params.uuid
    );

    if (!deletedProduct || deletedProduct.affectedRows === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found or already inactive",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("active images")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while deleting the product",
    });
  }
};

// Get recommended products for a specific product
export const getRecommendedProducts = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { limit = 4 } = req.query;

    const result = await productModel.getRecommendedProducts(
      uuid,
      parseInt(limit)
    );

    if (!result.recommendedProducts?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No recommended products found",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Recommended products fetched successfully",
      data: result.recommendedProducts,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message:
        error.message ||
        "An error occurred while fetching recommended products",
    });
  }
};
