import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getProductByUuid = async (uuid) => {
  try {
    const product = await query(
      "SELECT * FROM products WHERE uuid = ? AND is_active = 1",
      [uuid]
    );
    return product?.[0] || null;
  } catch (error) {
    throw new Error(`Error fetching product by uuid: ${error.message}`);
  }
};

export const getImagesByProductUuid = async (productUuid) => {
  try {
    const images = await query(
      `SELECT pi.* 
       FROM product_images pi 
       JOIN products p ON p.id = pi.p_id 
       WHERE p.uuid = ? AND p.is_active = 1`,
      [productUuid]
    );
    return images || [];
  } catch (error) {
    throw new Error(`Error fetching product images: ${error.message}`);
  }
};

export const getImageByUuid = async (uuid) => {
  try {
    const result = await query("SELECT * FROM product_images WHERE uuid = ? ", [
      uuid,
    ]);
    return result?.[0] || null;
  } catch (error) {
    throw new Error(`Error fetching image: ${error.message}`);
  }
};

export const addProductImageByProductUuid = async (productUuid, imageData) => {
  try {
    const { image_url, is_featured, user_id } = imageData;
    let finalImageUrl = image_url;

    // handle base64 image if provided
    if (image_url && image_url.startsWith("data:image/")) {
      // extract the base64 data from the data URL
      const matches = image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      if (matches && matches.length === 3) {
        const type = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, "base64");

        // extract the MIME type
        const extension = type.split("/")[1] || "jpg";

        const imageUuid = uuidv4();
        const filename = `${imageUuid}.${extension}`;

        const uploadDir = path.join(__dirname, "../uploads");
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);

        //update image url to use the relative path
        finalImageUrl = `/uploads/${filename}`;
      }
    }

    // get the product ID from UUID
    const product = await query(
      "SELECT id FROM products WHERE uuid = ? AND is_active = 1",
      [productUuid]
    );

    if (!product?.[0]) {
      throw new Error("Product not found or inactive");
    }

    const p_id = product[0].id;
    const uuid = uuidv4();

    // Insert the image
    const result = await query(
      "INSERT INTO product_images (uuid, p_id, image_url, is_featured, is_active, created_by, updated_by) VALUES (?, ?, ?, ?, 1, ?, ?)",
      [uuid, p_id, finalImageUrl, is_featured ? 1 : 0, user_id, user_id]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to add product image");
    }

    // If this is a featured image, unset others
    if (is_featured) {
      await query(
        "UPDATE product_images SET is_featured = 0 WHERE p_id = ? AND uuid != ? AND is_active = 1",
        [p_id, uuid]
      );
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error adding product image: ${error.message}`);
  }
};

export const updateProductImageByUuid = async (uuid, imageData) => {
  try {
    const { is_featured, is_active } = imageData;

    // First get the image to check existence and get p_id if needed
    const image = await query("SELECT * FROM product_images WHERE uuid = ?", [
      uuid,
    ]);

    if (!image?.[0]) {
      throw new Error("Image not found");
    }

    // Update the image
    const result = await query(
      "UPDATE product_images SET is_featured = ?, is_active = COALESCE(?, is_active) WHERE uuid = ?",
      [is_featured ? 1 : 0, is_active ? 1 : 0, uuid]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to update product image");
    }

    // If setting as featured and image is active, unset other images for this product
    if (is_featured && (is_active === undefined || is_active)) {
      await query(
        "UPDATE product_images SET is_featured = 0 WHERE p_id = ? AND uuid != ? AND is_active = 1",
        [image[0].p_id, uuid]
      );
    }

    return result;
  } catch (error) {
    throw new Error(`Error updating product image: ${error.message}`);
  }
};

export const deleteProductImageByUuid = async (uuid) => {
  try {
    const result = await query(
      "UPDATE product_images SET is_active = 0 WHERE uuid = ? AND is_active = 1",
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
