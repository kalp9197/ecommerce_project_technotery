import { dbService } from "../../services/index.js";
import { v4 as uuidv4 } from "uuid";

// Create product reviews table if it doesn't exist
export const ensureProductReviewsTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL,
      review TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating product_reviews table: ${error.message}`);
  }
};

// Get reviews for a product
export const getProductReviews = async (productUuid, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const reviews = await dbService.query(
      `SELECT
          pr.uuid, pr.rating, pr.review, pr.created_at,
          u.name as user_name
        FROM
          product_reviews pr
        JOIN
          products p ON pr.product_id = p.id
        JOIN
          users u ON pr.user_id = u.id
        WHERE
          p.uuid = ? AND pr.is_active = 1
        ORDER BY
          pr.created_at DESC
        LIMIT
          ${limit}
        OFFSET
          ${offset}`,
      [productUuid]
    );

    // Get total count for pagination
    const countResult = await dbService.query(
      `SELECT
          COUNT(*) as total
        FROM
          product_reviews pr
        JOIN
          products p ON pr.product_id = p.id
        WHERE
          p.uuid = ? AND pr.is_active = 1`,
      [productUuid]
    );

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      reviews: reviews || [],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching product reviews: ${error.message}`);
  }
};

// Add a review for a product
export const addReview = async (productUuid, userId, rating, review) => {
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

    // Check if user has already reviewed this product
    const existingReviews = await dbService.query(
      `SELECT
          *
        FROM
          product_reviews pr
        JOIN
          users u ON pr.user_id = u.id
        WHERE
          pr.product_id = ? AND u.id = ? AND pr.is_active = 1`,
      [productId, userId]
    );

    if (existingReviews?.length) {
      throw new Error("You have already reviewed this product");
    }

    // Add review
    const uuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          product_reviews (uuid, product_id, user_id, rating, review)
        VALUES
          (?, ?, ?, ?, ?)`,
      [uuid, productId, userId, rating, review]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to add review");
    }

    // Update product average rating
    await updateProductRating(productId);

    return uuid;
  } catch (error) {
    throw new Error(`Error adding review: ${error.message}`);
  }
};

// Update a review
export const updateReview = async (reviewUuid, userId, rating, review) => {
  try {
    // Check if review exists and belongs to user
    const reviews = await dbService.query(
      `SELECT
          pr.*
        FROM
          product_reviews pr
        JOIN
          users u ON pr.user_id = u.id
        WHERE
          pr.uuid = ? AND u.id = ? AND pr.is_active = 1`,
      [reviewUuid, userId]
    );

    if (!reviews?.length) {
      throw new Error("Review not found or unauthorized");
    }

    // Update review
    const result = await dbService.query(
      `UPDATE
          product_reviews
        SET
          rating = ?,
          review = ?
        WHERE
          uuid = ?`,
      [rating, review, reviewUuid]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to update review");
    }

    // Update product average rating
    await updateProductRating(reviews[0].product_id);

    return true;
  } catch (error) {
    throw new Error(`Error updating review: ${error.message}`);
  }
};

// Delete a review
export const deleteReview = async (reviewUuid, userId) => {
  try {
    // Check if review exists and belongs to user
    const reviews = await dbService.query(
      `SELECT
          pr.*
        FROM
          product_reviews pr
        JOIN
          users u ON pr.user_id = u.id
        WHERE
          pr.uuid = ? AND u.id = ? AND pr.is_active = 1`,
      [reviewUuid, userId]
    );

    if (!reviews?.length) {
      throw new Error("Review not found or unauthorized");
    }

    // Soft delete review
    const result = await dbService.query(
      `UPDATE
          product_reviews
        SET
          is_active = 0
        WHERE
          uuid = ?`,
      [reviewUuid]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to delete review");
    }

    // Update product average rating
    await updateProductRating(reviews[0].product_id);

    return true;
  } catch (error) {
    throw new Error(`Error deleting review: ${error.message}`);
  }
};

// Update product average rating
const updateProductRating = async (productId) => {
  try {
    const ratings = await dbService.query(
      `SELECT
          AVG(rating) as avg_rating,
          COUNT(*) as review_count
        FROM
          product_reviews
        WHERE
          product_id = ? AND is_active = 1`,
      [productId]
    );

    if (!ratings?.length) return;

    const avgRating = ratings[0].avg_rating || 0;
    const reviewCount = ratings[0].review_count || 0;

    await dbService.query(
      `UPDATE
          products
        SET
          avg_rating = ?,
          review_count = ?
        WHERE
          id = ?`,
      [avgRating, reviewCount, productId]
    );
  } catch (error) {
    throw new Error(`Error updating product rating: ${error.message}`);
  }
};
