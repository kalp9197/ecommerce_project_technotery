import * as productModel from "../models/productModel.js";

export const getProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page or limit value",
      });
    }

    const offset = (page - 1) * limit;

    const products = await productModel.getAllProducts(limit, offset);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching products",
    });
  }
};

export const getProductByUUID = async (req, res) => {
  try {
    const product = await productModel.getProductByUuid(req.params.uuid);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching the product",
    });
  }
};

export const addProduct = async (req, res) => {
  try {
    const productUuid = await productModel.createProduct(
      req.body,
      req.user?.id
    );

    if (!productUuid) {
      return res.status(400).json({
        success: false,
        message: "Failed to create product",
      });
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { uuid: productUuid },
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while creating the product",
    });
  }
};

export const updateProductByUUID = async (req, res) => {
  try {
    const updatedProduct = await productModel.updateProductByUuid(
      req.params.uuid,
      req.body
    );

    if (!updatedProduct || updatedProduct.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or no changes made",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct.data,
    });
  } catch (error) {
    // Check for specific error cases to return appropriate status codes
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while updating the product",
    });
  }
};

export const removeProductByUUID = async (req, res) => {
  try {
    const deletedProduct = await productModel.deleteProductByUuid(
      req.params.uuid
    );

    if (!deletedProduct || deletedProduct.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or already inactive",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    // Check for specific error messages related to images
    if (error.message.includes("active images")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while deleting the product",
    });
  }
};
