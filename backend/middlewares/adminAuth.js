import { dbService } from "../services/index.js";
import { HTTP_STATUS } from "../constants/index.js";

// Middleware to check for admin privileges
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.uuid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await dbService.query(
      "SELECT is_admin FROM users WHERE uuid = ? AND is_active = 1",
      [req.user.uuid]
    );

    if (!result?.length || result[0].is_admin !== 1) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Middleware to restrict admin access
export const isNotAdmin = async (req, res, next) => {
  try {
    if (!req.user?.uuid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await dbService.query(
      "SELECT is_admin FROM users WHERE uuid = ? AND is_active = 1",
      [req.user.uuid]
    );

    if (!result?.length || result[0].is_admin === 1) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You don't have permission to perform this action",
      });
    }

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
