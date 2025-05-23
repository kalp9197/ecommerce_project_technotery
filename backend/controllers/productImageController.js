import { HTTP_STATUS } from "../constants/index.js";
import * as imageModel from "../models/productImageModel.js";
import { getProductByUuid } from "../models/productModel.js";

export const getProductImagesByUuid = async (req, res) => {
  try {
    const { productUuid } = req.params;

    const product = await getProductByUuid(productUuid);
    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while fetching product images",
      });
    }

    const images = await imageModel.getImagesByProductUuid(productUuid);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while fetching product images : ${error.message}`,
    });
  }
};

export const addProductImage = async (req, res) => {
  try {
    const { productUuid } = req.params;
    const product = await getProductByUuid(productUuid);

    if (!product) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while adding product image",
      });
    }

    const imageData = { ...req.body, user_id: req.user.id };
    const uuid = await imageModel.addProductImageByProductUuid(
      productUuid,
      imageData
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Product image added successfully",
      uuid,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `An error occurred while adding product image : ${error.message}`,
    });
  }
};

export const updateProductImageByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { is_featured, is_active, image_path } = req.body;

    const image = await imageModel.getImageByUuid(uuid);
    if (!image) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while updating product image",
      });
    }

    const updateData = {};
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (image_path !== undefined) updateData.image_path = image_path;

    const updatedImage = await imageModel.updateProductImageByUuid(
      uuid,
      updateData
    );

    if (!updatedImage || updatedImage.affectedRows === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while updating product image",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Image updated successfully",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while updating product image : ${error.message}`,
    });
  }
};

export const deleteProductImageByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;

    const image = await imageModel.getImageByUuid(uuid);
    if (!image) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while deleting product image",
      });
    }

    const deletedImage = await imageModel.deleteProductImageByUuid(uuid);
    if (!deletedImage || deletedImage.affectedRows === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while deleting product image",
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while deleting product image : ${error.message}`,
    });
  }
};
