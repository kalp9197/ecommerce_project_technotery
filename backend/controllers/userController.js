import * as userModel from "../models/userModel.js";
import { dbService, userService } from "../services/index.js";
import { HTTP_STATUS } from "../constants/index.js";
import { JWT_CONFIG } from "../constants/index.js";
import jwt from "jsonwebtoken";

// Register new user
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
      message: `An error occurred while registering user : ${error.message}`,
    });
  }
};

// Authenticate user
export const login = async (req, res) => {
  try {
    const user = await userModel.getUserByEmail(req.body);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while logging in",
      });
    }

    const isPasswordValid = await userModel.verifyPassword(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "An error occurred while logging in",
      });
    }

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
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "An error occurred while logging in",
      });
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
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while logging in : ${error.message}`,
    });
  }
};

// Toggle user account status
export const activateDeactivate = async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const user = await userModel.getUserByUuidWithoutActiveFilter(uuid);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "An error occurred while activating/deactivating user",
      });
    }

    const newStatus = user.is_active === 1 ? 0 : 1;
    const result = await userModel.updateUserStatus(uuid, newStatus);
    if (!result) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An error occurred while activating/deactivating user",
      });
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
      message: `An error occurred while activating/deactivating user : ${error.message}`,
    });
  }
};

// Generate new JWT token
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
        message: "An error occurred while refreshing token",
      });
    }

    let tokenInfo;
    let decodedToken = null;

    if (token) {
      try {
        decodedToken = jwt.decode(token);
      } catch (e) {}

      if (!tokenId) {
        tokenInfo = await dbService.query(
          "SELECT * FROM user_tokens WHERE token = ? AND is_expired = 0",
          [token]
        );

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
        message: "An error occurred while refreshing token",
        requiresLogin: true,
      });
    }

    const currentTokenId = tokenInfo[0].id;

    if (tokenInfo[0].refresh_cycles <= 1) {
      await dbService.query(
        "UPDATE user_tokens SET is_expired = 1 WHERE id = ?",
        [currentTokenId]
      );
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "An error occurred while refreshing token",
        refreshCycles: 0,
        is_expired: 1,
        requiresLogin: true,
      });
    }

    const refreshData = await userModel.refreshToken(currentTokenId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Token refreshed successfully",
      token: refreshData.token,
      refreshCycles: refreshData.refreshCycles,
      expiresInMinutes: JWT_CONFIG.EXPIRES_IN_MINUTES,
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
      message: `An error occurred while refreshing token : ${error.message}`,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while verifying email",
      });
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
      message: `An error occurred while verifying email : ${error.message}`,
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while resending verification email",
      });
    }

    await userService.resendUserVerificationEmail(email);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `An error occurred while resending verification email : ${error.message}`,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "An error occurred while fetching users",
      });
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
      message: `An error occurred while fetching users : ${error.message}`,
    });
  }
};
