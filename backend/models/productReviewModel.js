import { query } from "../utils/db.js";
import { v4 as uuidv4 } from "uuid";

// Get all reviews for a product
export const getReviewsByProductUuid = async (productUuid) => {
  try {
    const reviews = await query(
      `
      SELECT 
        pr.uuid,
        pr.rating,
        pr.review,
        u.name as user_name,
        pr.created_at
      FROM 
        product_reviews pr
      JOIN 
        products p ON pr.product_id = p.id
      JOIN 
        users u ON pr.user_id = u.id
      WHERE 
        p.uuid = ?
      ORDER BY 
        pr.created_at DESC
      `,
      [productUuid]
    );

    return reviews;
  } catch (error) {
    throw new Error(`Error fetching reviews: ${error.message}`);
  }
};

// Get a single review by UUID
export const getReviewByUuid = async (uuid) => {
  try {
    const reviews = await query(
      `
      SELECT 
        pr.uuid,
        pr.product_id,
        pr.user_id,
        pr.rating,
        pr.review,
        pr.created_at,
        pr.updated_at
      FROM 
        product_reviews pr
      WHERE 
        pr.uuid = ?
      LIMIT 1
      `,
      [uuid]
    );

    if (!reviews.length) {
      throw new Error("Review not found");
    }

    return reviews[0];
  } catch (error) {
    throw new Error(`Error fetching review: ${error.message}`);
  }
};

// Create a new review
export const createReview = async (productUuid, userId, rating, review) => {
  try {
    // Convert rating to float between 0 and 5
    rating = parseFloat(rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      throw new Error("Rating must be a number between 0 and 5");
    }

    // Get product ID from UUID
    const productResult = await query(
      `SELECT id FROM products WHERE uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!productResult || !productResult.length) {
      throw new Error("Product not found or inactive");
    }

    const productId = productResult[0].id;

    // Check if user has already reviewed this product
    const existingReview = await query(
      `SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?`,
      [productId, userId]
    );

    if (existingReview && existingReview.length > 0) {
      throw new Error("You have already reviewed this product");
    }

    const uuid = uuidv4();

    // Insert the review
    const result = await query(
      `
      INSERT INTO product_reviews 
        (uuid, product_id, user_id, rating, review) 
      VALUES (?, ?, ?, ?, ?)
      `,
      [uuid, productId, userId, rating, review || null]
    );

    if (!result || result.affectedRows === 0) {
      throw new Error("Failed to create review");
    }

    return uuid;
  } catch (error) {
    throw new Error(`Error creating review: ${error.message}`);
  }
};

// Update an existing review
export const updateReview = async (uuid, userId, rating, review) => {
  try {
    // Convert rating to float between 0 and 5
    if (rating !== undefined) {
      rating = parseFloat(rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        throw new Error("Rating must be a number between 0 and 5");
      }
    }

    // Check if review exists and belongs to the user
    const reviewResult = await query(
      `SELECT id FROM product_reviews WHERE uuid = ? AND user_id = ?`,
      [uuid, userId]
    );

    if (!reviewResult || !reviewResult.length) {
      throw new Error(
        "Review not found or you don't have permission to update it"
      );
    }

    // Update the review
    const result = await query(
      `
      UPDATE product_reviews 
      SET 
        rating = COALESCE(?, rating),
        review = COALESCE(?, review),
        updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ?
      `,
      [rating, review, uuid]
    );

    if (result.affectedRows === 0) {
      throw new Error("No changes made to the review");
    }

    // Get updated review
    return await getReviewByUuid(uuid);
  } catch (error) {
    throw new Error(`Error updating review: ${error.message}`);
  }
};

// Delete a review
export const deleteReview = async (uuid, userId) => {
  try {
    // Check if review exists and belongs to the user or user is admin
    const reviewCheck = await query(
      `
      SELECT pr.id 
      FROM product_reviews pr
      WHERE pr.uuid = ? 
      `,
      [uuid]
    );

    if (!reviewCheck || !reviewCheck.length) {
      throw new Error("Review not found");
    }

    // Check if user owns the review or is admin
    const userCheck = await query(
      `
      SELECT 1
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.uuid = ? AND (pr.user_id = ? OR u.is_admin = 1)
      `,
      [uuid, userId]
    );

    if (!userCheck || !userCheck.length) {
      throw new Error("You don't have permission to delete this review");
    }

    // Delete the review
    const result = await query(`DELETE FROM product_reviews WHERE uuid = ?`, [
      uuid,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete review");
    }

    return result;
  } catch (error) {
    throw new Error(`Error deleting review: ${error.message}`);
  }
};
