import { HTTP_STATUS } from "../constants/index.js";
import * as productModel from "../models/productModel.js";

// Refresh product cache - can be called when direct DB changes are made
export const refreshCache = async (req, res) => {
  try {
    const result = await productModel.refreshProductCache();

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: `An error occurred while refreshing cache : ${result.message}`,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product cache refreshed successfully",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while refreshing cache : ${error.message}`,
    });
  }
};

// Get paginated product list
export const getProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while fetching products",
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
      message: `Products fetched successfully from ${
        result.fromCache ? "cache" : "database"
      }`,
      data: result.products,
      source: result.fromCache ? "cache" : "database",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while fetching products : ${error.message}`,
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
        message: "An error occurred while searching for products",
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
      message: `An error occurred while searching for products : ${error.message}`,
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
        message: "An error occurred while fetching the product",
      });
    }

    res.status(HTTP_STATUS.OK).json({ success: true, data: product });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while fetching the product : ${error.message}`,
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
        message: "An error occurred while creating the product",
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
        message: `An error occurred while creating the product : ${error.message}`,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while creating the product : ${error.message}`,
    });
  }
};

// Update existing product
export const updateProductByUUID = async (req, res) => {
  try {
    const updatedProduct = await productModel.updateProductByUuid(
      req.params.uuid,
      req.body,
      req.user?.id
    );

    if (!updatedProduct || updatedProduct.affectedRows === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while updating the product",
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
        message: `An error occurred while updating the product : ${error.message}`,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while updating the product : ${error.message}`,
    });
  }
};

// Delete product
export const removeProductByUUID = async (req, res) => {
  try {
    const deletedProduct = await productModel.deleteProductByUuid(
      req.params.uuid,
      req.user?.id
    );

    if (!deletedProduct || deletedProduct.affectedRows === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while deleting the product",
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
        message: `An error occurred while deleting the product : ${error.message}`,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while deleting the product : ${error.message}`,
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { uuid } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while fetching products by category",
      });
    }

    const offset = (page - 1) * limit;
    const result = await productModel.getProductsByCategory(
      uuid,
      limit,
      offset
    );

    if (!result.products?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while fetching products by category",
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
      message: `An error occurred while fetching products by category : ${error.message}`,
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
        message: "An error occurred while fetching recommended products",
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
      message: `An error occurred while fetching recommended products : ${error.message}`,
    });
  }
};
