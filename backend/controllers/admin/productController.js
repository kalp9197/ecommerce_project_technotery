import { HTTP_STATUS } from "../../constants/index.js";
import { productModel } from "../../models/admin/index.js";
import { dbService } from "../../services/index.js";

// Add a new product
export const addProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productData = {
      ...req.body,
      created_by: userId,
    };

    const productUuid = await productModel.createProduct(productData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Product added successfully",
      data: { uuid: productUuid },
    });
  } catch (error) {
    if (error.message.includes("Category not found")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to add product: ${error.message}`,
    });
  }
};

// Update a product
export const updateProductByUUID = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;
    const productData = {
      ...req.body,
      updated_by: userId,
    };

    const result = await productModel.updateProductByUuid(uuid, productData);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    if (error.message.includes("Category not found")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to update product: ${error.message}`,
    });
  }
};

// Delete a product
export const removeProductByUUID = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const result = await productModel.deleteProductByUuid(uuid, userId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to delete product: ${error.message}`,
    });
  }
};
