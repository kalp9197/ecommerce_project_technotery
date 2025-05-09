import { HTTP_STATUS } from "../../constants/index.js";
import { imageModel } from "../../models/admin/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(dirname(dirname(dirname(__dirname))), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Add a product image
export const addProductImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productUuid } = req.params;
    const { isFeatured } = req.body;

    if (!req.files || !req.files.image) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const imageFile = req.files.image;
    const fileExtension = path.extname(imageFile.name).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid file type. Only images are allowed.",
      });
    }

    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    const relativePath = `/uploads/${fileName}`;

    // Save file to disk
    await imageFile.mv(filePath);

    // Save image record in database
    const imageUuid = await imageModel.addProductImage(
      productUuid,
      relativePath,
      userId,
      isFeatured === "true" || isFeatured === true ? 1 : 0
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        uuid: imageUuid,
        path: relativePath,
      },
    });
  } catch (error) {
    if (error.message.includes("Product not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to upload image: ${error.message}`,
    });
  }
};

// Update a product image
export const updateProductImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;
    const { isFeatured } = req.body;

    const result = await imageModel.updateProductImage(
      uuid,
      isFeatured === "true" || isFeatured === true ? 1 : 0,
      userId
    );

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Image updated successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to update image: ${error.message}`,
    });
  }
};

// Delete a product image
export const deleteProductImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const result = await imageModel.deleteProductImage(uuid, userId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to delete image: ${error.message}`,
    });
  }
};

// Set an image as featured
export const setFeaturedImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const result = await imageModel.setFeaturedImage(uuid, userId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Image set as featured successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to set featured image: ${error.message}`,
    });
  }
};
