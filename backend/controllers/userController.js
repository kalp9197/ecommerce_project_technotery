import * as userModel from "../models/userModel.js";
import { dbService, userService, emailService } from "../services/index.js";
import { HTTP_STATUS } from "../constants/index.js";
import { appConfig } from "../config/app.config.js";
import { JWT_CONFIG } from "../constants/index.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const result = await userService.registerUser(req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: { email: result.user.email, email_verified: false },
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await userModel.getUserByEmail(req.body);
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await userModel.verifyPassword(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: "Invalid password" });
    }

    // Check email verification status
    if (user.email_verified !== 1 && user.is_admin !== 1) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message:
          "Email not verified. Please verify your email before logging in.",
        emailVerified: false,
      });
    }

    const tokenData = await userModel.generateToken(user.uuid);
    if (!tokenData) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: "Token generation failed" });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      token: tokenData.token,
      refreshCycles: tokenData.refreshCycles,
      expiresInMinutes: JWT_CONFIG.EXPIRES_IN_MINUTES,
      user: {
        email: user.email,
        is_admin: user.is_admin === 1,
        email_verified: true,
      },
    });
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: `Login failed: ${error.message}` });
  }
};

export const activateDeactivate = async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const user = await userModel.getUserByUuidWithoutActiveFilter(uuid);
    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    const newStatus = user.is_active === 1 ? 0 : 1;
    const result = await userModel.updateUserStatus(uuid, newStatus);
    if (!result) {
      return res
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Failed to update user status" });
    }

    if (newStatus === 1 && user.is_active === 0) {
      await userModel.generateToken(uuid);
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: newStatus === 0 ? "Account deactivated" : "Account activated",
      ...(newStatus === 0 && { data: { tokens_expired: true } }),
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Status update failed: ${error.message}`,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const tokenId = req.tokenId;
    const token =
      req.body.token ||
      req.body.refresh_token ||
      req.headers.authorization?.replace("Bearer ", "") ||
      req.query.token ||
      req.query.refresh_token;

    if (!tokenId && !token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Token identifier or token is required",
      });
    }

    // Find token in database
    let tokenInfo;
    let decodedToken = null;

    if (token) {
      try {
        decodedToken = jwt.decode(token);
      } catch (e) {}

      if (!tokenId) {
        // Try to find by token value
        tokenInfo = await dbService.query(
          "SELECT * FROM user_tokens WHERE token = ? AND is_expired = 0",
          [token]
        );

        // If not found, try by UUID
        if (!tokenInfo?.length && decodedToken?.uuid) {
          tokenInfo = await dbService.query(
            "SELECT ut.* FROM user_tokens ut JOIN users u ON ut.user_id = u.id WHERE u.uuid = ? AND ut.is_expired = 0 ORDER BY ut.id DESC LIMIT 1",
            [decodedToken.uuid]
          );
        }
      }
    }

    if (tokenId && !tokenInfo?.length) {
      tokenInfo = await dbService.query(
        "SELECT * FROM user_tokens WHERE id = ?",
        [tokenId]
      );
    }

    if (!tokenInfo?.length) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Token has expired. Please login again.",
        requiresLogin: true,
      });
    }

    const currentTokenId = tokenInfo[0].id;

    // Check if we've hit max refresh limit
    if (tokenInfo[0].refresh_cycles <= 1) {
      await dbService.query(
        "UPDATE user_tokens SET is_expired = 1 WHERE id = ?",
        [currentTokenId]
      );
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Maximum token refresh limit reached. Please login again.",
        refreshCycles: 0,
        is_expired: 1,
        requiresLogin: true,
      });
    }

    // Generate fresh token with updated refresh count
    const refreshData = await userModel.refreshToken(currentTokenId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Token refreshed successfully",
      token: refreshData.token,
      refreshCycles: refreshData.refreshCycles,
      expiresInMinutes: appConfig.tokenExpiresInMinutes,
    });
  } catch (error) {
    if (error.message.includes("max token refresh reached")) {
      const currentTokenId = req.tokenId;
      if (currentTokenId) {
        await dbService.query(
          "UPDATE user_tokens SET is_expired = 1 WHERE id = ?",
          [currentTokenId]
        );
      }
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Maximum token refresh limit reached. Please login again.",
        refreshCycles: 0,
        is_expired: 1,
        requiresLogin: true,
      });
    }
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: `Invalid or expired token: ${error.message}`,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: "Verification token is required" });
    }

    await userModel.verifyEmail(token);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message:
        "Email verified successfully. You can now log in to your account.",
      email_verified: true,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Email verification failed",
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: "Email is required" });
    }

    // Use the userService to handle resending verification email
    await userService.resendUserVerificationEmail(email);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: "Invalid page or limit value" });
    }

    const result = await userModel.getAllUsers(page, limit);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
