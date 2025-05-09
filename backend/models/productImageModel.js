import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Setup directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize product_images table if not exists
export const ensureProductImagesTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      uuid        VARCHAR(36) NOT NULL UNIQUE,
      p_id        INT         NOT NULL,
      image_path  VARCHAR(255) NOT NULL,
      is_featured BOOLEAN     NOT NULL DEFAULT FALSE,
      is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
      created_by  INT,
      updated_by  INT,
      created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (p_id)        REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL,
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

// Get single image by UUID
export const getImageByUuid = async (uuid) => {
  try {
    const result = await dbService.query(
      `SELECT
          *
        FROM
          product_images
        WHERE
          uuid = ?`,
      [uuid]
    );
    return result?.[0] || null;
  } catch (error) {
    throw new Error(`Error fetching image: ${error.message}`);
  }
};

// Create new product image record
export const addProductImageByProductUuid = async (productUuid, imageData) => {
  try {
    const { image_path, is_featured, user_id } = imageData;
    let finalImagePath = image_path;

    // Verify product exists and is active
    const product = await dbService.query(
      `SELECT
          id
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!product?.[0]) {
      throw new Error("Product not found or inactive");
    }

    // Process base64 image if provided
    if (image_path && image_path.startsWith("data:image/")) {
      const matches = image_path.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches && matches.length === 3) {
        // Extract image data and type
        const type = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, "base64");
        const extension = type.split("/")[1] || "jpg";
        const imageUuid = uuidv4();
        const filename = `${imageUuid}.${extension}`;

        // Ensure upload directory exists
        const uploadDir = path.join(__dirname, "../uploads");
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save image to filesystem
        fs.writeFileSync(filePath, buffer);
        finalImagePath = `/uploads/${filename}`;
      }
    }

    const p_id = product[0].id;
    const uuid = uuidv4();

    // Create image record in database
    const result = await dbService.query(
      `INSERT INTO
          product_images (uuid, p_id, image_path, is_featured, is_active, created_by, updated_by)
        VALUES
          (?, ?, ?, ?, 1, ?, ?)`,
      [uuid, p_id, finalImagePath, is_featured ? 1 : 0, user_id, user_id]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to add product image");
    }

    // If this image is featured, un-feature other images
    if (is_featured) {
      await dbService.query(
        `UPDATE
            product_images
          SET
            is_featured = 0
          WHERE
            p_id = ? AND uuid != ? AND is_active = 1`,
        [p_id, uuid]
      );
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error adding product image: ${error.message}`);
  }
};

// Update image properties
export const updateProductImageByUuid = async (uuid, imageData) => {
  try {
    const { is_featured, is_active, image_path } = imageData;

    // Get existing image details
    const image = await dbService.query(
      `SELECT
          *
        FROM
          product_images
        WHERE
          uuid = ?`,
      [uuid]
    );

    if (!image?.[0]) {
      throw new Error("Image not found");
    }

    // Handle optional parameters with fallbacks
    const featuredValue =
      is_featured === undefined ? image[0].is_featured : is_featured ? 1 : 0;
    const activeValue = is_active === undefined ? null : is_active ? 1 : 0;

    let finalImagePath = image_path;

    // Process new image if provided in base64 format
    if (image_path && image_path.startsWith("data:image/")) {
      const matches = image_path.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches && matches.length === 3) {
        // Extract image data and type
        const type = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, "base64");
        const extension = type.split("/")[1] || "jpg";
        const imageUuid = uuidv4();
        const filename = `${imageUuid}.${extension}`;

        // Ensure upload directory exists
        const uploadDir = path.join(__dirname, "../uploads");
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save new image to filesystem
        fs.writeFileSync(filePath, buffer);
        finalImagePath = `/uploads/${filename}`;
      }
    }

    // Update image record with new values
    const result = await dbService.query(
      `UPDATE
          product_images
        SET
          is_featured = ?,
          is_active = COALESCE(?, is_active),
          image_path = COALESCE(?, image_path)
        WHERE
          uuid = ?`,
      [featuredValue, activeValue, finalImagePath, uuid]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to update product image");
    }

    // If image becomes/stays featured and active, un-feature other images
    if (featuredValue === 1 && (activeValue === null || activeValue === 1)) {
      await dbService.query(
        `UPDATE
            product_images
          SET
            is_featured = 0
          WHERE
            p_id = ? AND uuid != ? AND is_active = 1`,
        [image[0].p_id, uuid]
      );
    }

    return result;
  } catch (error) {
    throw new Error(`Error updating product image: ${error.message}`);
  }
};

// Soft-delete product image
export const deleteProductImageByUuid = async (uuid) => {
  try {
    const result = await dbService.query(
      `UPDATE
          product_images
        SET
          is_active = 0
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );

    if (!result?.affectedRows) {
      throw new Error("Image not found or already inactive");
    }

    return result;
  } catch (error) {
    throw new Error(`Error deleting product image: ${error.message}`);
  }
};
