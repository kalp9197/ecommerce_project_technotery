import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(dirname(dirname(dirname(__dirname))), "uploads");

// Create product images table if it doesn't exist
export const ensureProductImagesTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      p_id INT NOT NULL,
      image_path VARCHAR(255) NOT NULL,
      is_featured TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_by INT,
      updated_by INT,
      FOREIGN KEY (p_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by)  REFERENCES users(id)    ON DELETE SET NULL
    )`);
  } catch (error) {
    throw new Error(`Error creating product_images table: ${error.message}`);
  }
};

// Retrieve all images for a specific product
export const getImagesByProductUuid = async (productUuid) => {
  try {
    const images = await dbService.query(
      `SELECT
          pi.*
        FROM
          product_images pi
        JOIN
          products p ON p.id = pi.p_id
        WHERE
          p.uuid = ? AND p.is_active = 1`,
      [productUuid]
    );
    return images || [];
  } catch (error) {
    throw new Error(`Error fetching product images: ${error.message}`);
  }
};

// Add a new image to a product
export const addProductImage = async (productUuid, imagePath, userId, isFeatured = 0) => {
  try {
    // Get product ID
    const products = await dbService.query(
      `SELECT
          id
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!products?.length) {
      throw new Error("Product not found");
    }

    const productId = products[0].id;

    // If this is a featured image, unset any existing featured images
    if (isFeatured === 1) {
      await dbService.query(
        `UPDATE
            product_images
          SET
            is_featured = 0
          WHERE
            p_id = ?`,
        [productId]
      );
    }

    // Add image
    const uuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          product_images (uuid, p_id, image_path, is_featured, created_by)
        VALUES
          (?, ?, ?, ?, ?)`,
      [uuid, productId, imagePath, isFeatured, userId]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to add product image");
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error adding product image: ${error.message}`);
  }
};

// Update product image
export const updateProductImage = async (imageUuid, isFeatured, userId) => {
  try {
    // Get image details
    const images = await dbService.query(
      `SELECT
          *
        FROM
          product_images
        WHERE
          uuid = ? AND is_active = 1`,
      [imageUuid]
    );

    if (!images?.length) {
      throw new Error("Image not found");
    }

    const image = images[0];

    // If setting as featured, unset any existing featured images
    if (isFeatured === 1) {
      await dbService.query(
        `UPDATE
            product_images
          SET
            is_featured = 0
          WHERE
            p_id = ?`,
        [image.p_id]
      );
    }

    // Update image
    const result = await dbService.query(
      `UPDATE
          product_images
        SET
          is_featured = ?,
          updated_by = ?
        WHERE
          uuid = ?`,
      [isFeatured, userId, imageUuid]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error updating product image: ${error.message}`);
  }
};

// Delete product image
export const deleteProductImage = async (imageUuid, userId) => {
  try {
    // Get image details
    const images = await dbService.query(
      `SELECT
          *
        FROM
          product_images
        WHERE
          uuid = ? AND is_active = 1`,
      [imageUuid]
    );

    if (!images?.length) {
      throw new Error("Image not found");
    }

    const image = images[0];

    // Delete image file
    const imagePath = path.join(uploadsDir, path.basename(image.image_path));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Soft delete image record
    const result = await dbService.query(
      `UPDATE
          product_images
        SET
          is_active = 0,
          updated_by = ?
        WHERE
          uuid = ?`,
      [userId, imageUuid]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error deleting product image: ${error.message}`);
  }
};

// Set image as featured
export const setFeaturedImage = async (imageUuid, userId) => {
  try {
    // Get image details
    const images = await dbService.query(
      `SELECT
          *
        FROM
          product_images
        WHERE
          uuid = ? AND is_active = 1`,
      [imageUuid]
    );

    if (!images?.length) {
      throw new Error("Image not found");
    }

    const image = images[0];

    // Unset any existing featured images
    await dbService.query(
      `UPDATE
          product_images
        SET
          is_featured = 0,
          updated_by = ?
        WHERE
          p_id = ?`,
      [userId, image.p_id]
    );

    // Set this image as featured
    const result = await dbService.query(
      `UPDATE
          product_images
        SET
          is_featured = 1,
          updated_by = ?
        WHERE
          uuid = ?`,
      [userId, imageUuid]
    );

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error setting featured image: ${error.message}`);
  }
};
