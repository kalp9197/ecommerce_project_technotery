import jwt from "jsonwebtoken";
import { dbService } from "../services/index.js";
import { appConfig } from "../config/app.config.js";
import { HTTP_STATUS } from "../constants/index.js";

// Validate and process JWT token
const verifyToken = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: "Authentication required",
      status: HTTP_STATUS.UNAUTHORIZED,
    };
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decode JWT and verify signature
    const decoded = jwt.verify(token, appConfig.jwtSecret);
    req.decodedToken = decoded;

    if (!decoded || !decoded.uuid) {
      return {
        error: "Invalid or expired token",
        status: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // Check if user exists and is active
    const userUuid = decoded.uuid;
    const userData = await dbService.query(
      "SELECT * FROM users WHERE uuid = ? AND is_active = 1",
      [userUuid]
    );

    if (!userData?.length) {
      return {
        error: "User not found",
        status: HTTP_STATUS.NOT_FOUND,
      };
    }

    req.decodedToken.id = userData[0].id;

    // Verify token hasn't been revoked
    const tokens = await dbService.query(
      "SELECT ut.* FROM user_tokens ut JOIN users u ON ut.user_id = u.id WHERE u.uuid = ? AND ut.is_expired = 0 ORDER BY ut.id DESC LIMIT 1",
      [userUuid]
    );

    if (!tokens?.length) {
      return {
        error: "Token has expired. Please login again.",
        status: HTTP_STATUS.UNAUTHORIZED,
        requiresLogin: true,
        is_expired: 1,
      };
    }

    // Check token expiration
    const userToken = tokens[0];
    const expiresAt = new Date(userToken.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      await dbService.query(
        "UPDATE user_tokens SET is_expired = 1 WHERE id = ?",
        [userToken.id]
      );

      return {
        error: "Token has expired. Please login again.",
        status: HTTP_STATUS.UNAUTHORIZED,
        requiresLogin: true,
        is_expired: 1,
      };
    }

    req.tokenId = userToken.id;
    req.refreshCycles = userToken.refresh_cycles;
    req.isExpired = 0;

    return {
      decoded: req.decodedToken,
      tokenId: userToken.id,
      is_expired: 0,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return {
        error: "Token has expired. Please login again.",
        status: HTTP_STATUS.UNAUTHORIZED,
        requiresLogin: true,
        is_expired: 1,
      };
    }
    return {
      error: "Authentication required",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};

// Authentication middleware for protected routes
export const authenticate = async (req, res, next) => {
  try {
    // Clean up expired tokens
    await dbService.updateExpiredTokens();

    const result = await verifyToken(req);
    if (result.error) {
      if (result.requiresLogin) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Token has expired. Please login again.",
          requiresLogin: true,
          is_expired: 1,
        });
      }

      return res.status(result.status).json({
        success: false,
        message: result.error,
        is_expired: result.is_expired !== undefined ? result.is_expired : 1,
      });
    }

    // Add user and token data to request object
    req.user = result.decoded;
    req.tokenId = result.tokenId;
    req.is_expired = result.is_expired || 0;

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while authenticating : ${error.message}`,
      is_expired: 1,
    });
  }
};
