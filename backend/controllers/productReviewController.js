import * as productReviewModel from "../models/productReviewModel.js";
import { HTTP_STATUS } from "../constants/index.js";

// Get all reviews for a product
export const getReviewsByProductUuid = async (req, res) => {
  try {
    const productUuid = req.params.productUuid;
    const reviews = await productReviewModel.getReviewsByProductUuid(
      productUuid
    );
    if (!reviews || reviews.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "No reviews found for this product",
      });
    }

    let totalRating = 0;
    for (const review of reviews) {
      totalRating += parseFloat(review.rating) || 0;
    }

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Product reviews retrieved successfully",
      data: {
        reviews: reviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while fetching reviews",
    });
  }
};

// Get a specific review by UUID
export const getReviewByUuid = async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const productUuid = req.params.productUuid;
    const review = await productReviewModel.getReviewByUuid(uuid, productUuid);
    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Review not found",
      });
    }
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Review retrieved successfully",
      data: review,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while fetching the review",
    });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { product_uuid, rating, review } = req.body;
    const userId = req.user.id;

    const reviewUuid = await productReviewModel.createReview(
      product_uuid,
      userId,
      rating,
      review
    );

    if (!reviewUuid) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while creating the review",
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Review created successfully",
      data: { uuid: reviewUuid },
    });
  } catch (error) {
    if (error.message.includes("already reviewed")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while creating the review",
    });
  }
};

// Update an existing review
export const updateReview = async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const { rating, review } = req.body;
    const userId = req.user.id;

    const updatedReview = await productReviewModel.updateReview(
      uuid,
      userId,
      rating,
      review
    );
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("don't have permission")
    ) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while updating the review",
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const userId = req.user.id;

    await productReviewModel.deleteReview(uuid, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("don't have permission")) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "An error occurred while deleting the review",
    });
  }
};
