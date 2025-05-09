import { HTTP_STATUS } from "../../constants/index.js";
import { reviewModel } from "../../models/user/index.js";

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productUuid } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await reviewModel.getProductReviews(
      productUuid,
      parseInt(page),
      parseInt(limit)
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Reviews fetched successfully",
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to get reviews: ${error.message}`,
    });
  }
};

// Add a review
export const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productUuid, rating, review } = req.body;

    const result = await reviewModel.addReview(
      productUuid,
      userId,
      rating,
      review
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Review added successfully",
      data: { uuid: result },
    });
  } catch (error) {
    if (
      error.message.includes("Product not found") ||
      error.message.includes("already reviewed")
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to add review: ${error.message}`,
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;
    const { rating, review } = req.body;

    const result = await reviewModel.updateReview(uuid, userId, rating, review);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    if (error.message.includes("not found or unauthorized")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to update review: ${error.message}`,
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uuid } = req.params;

    const result = await reviewModel.deleteReview(uuid, userId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("not found or unauthorized")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to delete review: ${error.message}`,
    });
  }
};
