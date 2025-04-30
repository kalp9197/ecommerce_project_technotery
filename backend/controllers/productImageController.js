import * as imageModel from "../models/productImageModel.js";
import { getProductByUuid } from "../models/productModel.js";

export const getProductImagesByUuid = async (req, res) => {
  try {
    const { productUuid } = req.params;

    // Check if product exists
    const product = await getProductByUuid(productUuid);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const images = await imageModel.getImagesByProductUuid(productUuid);

    // Empty array is a valid response, just means no images for this product
    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to get product images: ${error.message}`,
    });
  }
};

export const addProductImage = async (req, res) => {
  try {
    const { productUuid } = req.params;
    // Check if product exists
    const product = await getProductByUuid(productUuid);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    // Add user_id to image data from auth middleware
    const imageData = { ...req.body, user_id: req.user.id };
    const uuid = await imageModel.addProductImageByProductUuid(
      productUuid,
      imageData
    );

    return res.status(201).json({
      success: true,
      message: "Product image added successfully",
      uuid,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProductImageByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { is_featured, is_active, image_path } = req.body;

    // Check if image exists
    const image = await imageModel.getImageByUuid(uuid);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Only include properties that are actually provided in the request
    const updateData = {};
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (image_path !== undefined) updateData.image_path = image_path;

    const updatedImage = await imageModel.updateProductImageByUuid(
      uuid,
      updateData
    );

    if (!updatedImage || updatedImage.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to update image",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to update product image: ${error.message}`,
    });
  }
};

export const deleteProductImageByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Check if image exists
    const image = await imageModel.getImageByUuid(uuid);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const deletedImage = await imageModel.deleteProductImageByUuid(uuid);
    if (!deletedImage || deletedImage.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete image",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to delete product image: ${error.message}`,
    });
  }
};
