import { query } from "../utils/db.js";

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uuid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await query(
      "SELECT is_admin FROM users WHERE uuid = ? AND is_active = 1",
      [req.user.uuid]
    );

    if (!result?.length || result[0].is_admin !== 1) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // User is an admin, proceed
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Admin authorization error: ${error.message}`,
    });
  }
};

export const isNotAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uuid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await query(
      "SELECT is_admin FROM users WHERE uuid = ? AND is_active = 1",
      [req.user.uuid]
    );

    if (!result?.length || result[0].is_admin === 1) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin users cannot perform cart operations.",
      });
    }

    // User is not an admin, proceed
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Authorization error: ${error.message}`,
    });
  }
};
