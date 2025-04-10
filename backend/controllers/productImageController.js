import * as imageModel from "../models/productImageModel.js";

export const getProductImagesByUuid = async (req, res) => {
  try {
    const { productUuid } = req.params;

    // Check if product exists
    const product = await imageModel.getProductByUuid(productUuid);
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

export const addProductImageByUuid = async (req, res) => {
  try {
    const { productUuid } = req.params;
    const { image_url, is_featured } = req.body;

    const imageUuid = await imageModel.addProductImageByProductUuid(
      productUuid,
      {
        image_url,
        is_featured,
        user_id: req.user?.id,
      }
    );

    if (!imageUuid) {
      return res.status(400).json({
        success: false,
        message: "Failed to add product image",
      });
    }

    const images = await imageModel.getImagesByProductUuid(productUuid);
    if (!images?.length) {
      return res.status(400).json({
        success: false,
        message: "Failed to get product images",
      });
    }

    res.status(201).json({
      success: true,
      message: "Image added successfully",
      data: images,
    });
  } catch (error) {
    if (error.message.includes("Product not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: `Failed to add product image: ${error.message}`,
    });
  }
};

export const updateProductImageByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { is_featured, is_active } = req.body;
    // Check if image exists
    const image = await imageModel.getImageByUuid(uuid);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const updatedImage = await imageModel.updateProductImageByUuid(uuid, {
      is_featured,
      is_active,
    });

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
