import { dbService } from "../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Get all reviews for a specific product
export const getReviewsByProductUuid = async (productUuid) => {
  try {
    const reviews = await dbService.query(
      `SELECT
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
        pr.created_at DESC`,
      [productUuid]
    );

    return reviews;
  } catch (error) {
    throw new Error(`Error fetching reviews: ${error.message}`);
  }
};

// Get a single review by its ID
export const getReviewByUuid = async (uuid) => {
  try {
    const reviews = await dbService.query(
      `SELECT
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
      LIMIT 1`,
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

// Add a new product review
export const createReview = async (productUuid, userId, rating, review) => {
  try {
    rating = parseFloat(rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      throw new Error("Rating must be a number between 0 and 5");
    }

    const productResult = await dbService.query(
      `SELECT
          id
        FROM
          products
        WHERE
          uuid = ? AND is_active = 1`,
      [productUuid]
    );

    if (!productResult?.length) {
      throw new Error("Product not found or inactive");
    }

    const productId = productResult[0].id;

    const existingReview = await dbService.query(
      `SELECT
          id
        FROM
          product_reviews
        WHERE
          product_id = ? AND user_id = ?`,
      [productId, userId]
    );

    if (existingReview?.length > 0) {
      throw new Error("You have already reviewed this product");
    }

    const uuid = uuidv4();

    const result = await dbService.query(
      `INSERT INTO
          product_reviews (uuid, product_id, user_id, rating, review)
        VALUES
          (?, ?, ?, ?, ?)`,
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

// Modify an existing review
export const updateReview = async (uuid, userId, rating, review) => {
  try {
    if (rating !== undefined) {
      rating = parseFloat(rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        throw new Error("Rating must be a number between 0 and 5");
      }
    }

    const reviewResult = await dbService.query(
      `SELECT
          id
        FROM
          product_reviews
        WHERE
          uuid = ? AND user_id = ?`,
      [uuid, userId]
    );

    if (!reviewResult?.length) {
      throw new Error(
        "Review not found or you don't have permission to update it"
      );
    }

    const safeRating = typeof rating !== "undefined" ? rating : null;
    const safeReview = typeof review !== "undefined" ? review : null;

    const result = await dbService.query(
      `UPDATE
          product_reviews
        SET
          rating = COALESCE(?, rating),
          review = COALESCE(?, review),
          updated_at = CURRENT_TIMESTAMP
        WHERE
          uuid = ?`,
      [safeRating, safeReview, uuid]
    );

    if (result.affectedRows === 0) {
      throw new Error("No changes made to the review");
    }

    return await getReviewByUuid(uuid);
  } catch (error) {
    throw new Error(`Error updating review: ${error.message}`);
  }
};

// Remove a review (user's own or admin)
export const deleteReview = async (uuid, userId) => {
  try {
    const reviewCheck = await dbService.query(
      `SELECT
          pr.id
        FROM
          product_reviews pr
        WHERE
          pr.uuid = ?`,
      [uuid]
    );

    if (!reviewCheck?.length) {
      throw new Error("Review not found");
    }

    const userCheck = await dbService.query(
      `SELECT
          1
        FROM
          product_reviews pr
        JOIN
          users u ON pr.user_id = u.id
        WHERE
          pr.uuid = ? AND (pr.user_id = ? OR u.is_admin = 1)`,
      [uuid, userId]
    );

    if (!userCheck?.length) {
      throw new Error("You don't have permission to delete this review");
    }

    const result = await dbService.query(
      `DELETE FROM
          product_reviews
        WHERE
          uuid = ?`,
      [uuid]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete review");
    }

    return result;
  } catch (error) {
    throw new Error(`Error deleting review: ${error.message}`);
  }
};
