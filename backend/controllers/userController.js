import * as userModel from "../models/userModel.js";
import { query } from "../utils/db.js";

export const register = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(req.body);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const userId = await userModel.createUser(req.body);
    if (!userId) {
      return res.status(422).json({
        success: false,
        message: "User registration failed",
      });
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Registration failed: ${error.message}`,
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await userModel.getUserByEmail(req.body);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify user's password
    const isPasswordValid = await userModel.verifyPassword(
      req.body.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate auth token for the user
    const tokenData = await userModel.generateToken(user.uuid);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Token generation failed",
      });
    }
    const expiresInMinutes = parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: tokenData.token,
      refreshCycles: tokenData.refreshCycles,
      expiresInMinutes: expiresInMinutes,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin === 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Login failed: ${error.message}`,
    });
  }
};

export const activateDeactivate = async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const user = await userModel.getUserByUuidWithoutActiveFilter(uuid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle user's active status
    const newStatus = user.is_active === 1 ? 0 : 1;
    const result = await userModel.updateUserStatus(uuid, newStatus);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Failed to update user status",
      });
    }

    // Create new token if reactivating account
    let tokenData = null;
    if (newStatus === 1 && user.is_active === 0) {
      tokenData = await userModel.generateToken(uuid);
    }
    if (newStatus === 0) {
      return res.status(200).json({
        success: true,
        message: "Account deactivated",
        data: {
          ...result,
          tokens_expired: true,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account activated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Status update failed: ${error.message}`,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const tokenId = req.tokenId;

    if (!tokenId) {
      return res.status(404).json({
        success: false,
        message: "Token identifier not found",
      });
    }

    const tokenInfo = await query("SELECT * FROM user_tokens WHERE id = ?", [
      tokenId,
    ]);

    if (!tokenInfo?.length) {
      return res.status(404).json({
        success: false,
        message: "Token not found",
      });
    }

    // Check if we've hit max refresh limit
    if (tokenInfo[0].refresh_cycles <= 1) {
      await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
        tokenId,
      ]);

      return res.status(403).json({
        success: false,
        message: "max token refresh reached",
        tokenId: parseInt(tokenId),
        refreshCycles: tokenInfo[0].refresh_cycles,
        is_expired: 1,
      });
    }

    // Generate fresh token with updated refresh count
    const refreshData = await userModel.refreshToken(tokenId);
    const expiresInMinutes =
      parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES) || 1;

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: refreshData.token,
      tokenId: refreshData.tokenId,
      refreshCycles: refreshData.refreshCycles,
      is_expired: 0,
      expiresInMinutes: expiresInMinutes,
    });
  } catch (error) {
    if (
      error.message === "max token refresh reached" ||
      error.message.includes("max token refresh reached")
    ) {
      // Mark token as expired when max refreshes hit
      const currentTokenId = req.tokenId;
      await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
        currentTokenId,
      ]);

      return res.status(403).json({
        success: false,
        message: "max token refresh reached",
        tokenId: parseInt(currentTokenId),
        refreshCycles: 0,
        is_expired: 1,
      });
    }

    return res.status(401).json({
      success: false,
      message: `Token refresh failed: ${error.message}`,
      is_expired: 0,
    });
  }
};
