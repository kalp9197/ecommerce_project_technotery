import * as userModel from "../models/userModel.js";
import { query } from "../utils/db.js";
import jwt from "jsonwebtoken";
import {
  sendEmail,
  getVerificationEmailTemplate,
} from "../utils/emailService.js";

export const register = async (req, res) => {
  try {
    const existingUser = await userModel.getUserByEmail(req.body);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const userUuid = await userModel.createUser(req.body);
    if (!userUuid) {
      return res.status(422).json({
        success: false,
        message: "User registration failed",
      });
    }

    const newUser = await userModel.getUserByUuid(userUuid);

    // Send verification email
    try {
      const userData = await query(
        "SELECT ut.verification_token FROM user_tokens ut JOIN users u ON ut.user_id = u.id WHERE u.uuid = ? AND ut.verification_token IS NOT NULL AND ut.is_expired = 0",
        [userUuid]
      );

      if (userData?.length && userData[0].verification_token) {
        const verificationUrl = `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/verify-email?token=${userData[0].verification_token}`;
        const emailTemplate = getVerificationEmailTemplate(
          newUser.name,
          verificationUrl
        );
        await sendEmail({
          to: newUser.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
      }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: { email: newUser.email, email_verified: false },
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await userModel.verifyPassword(
      req.body.password,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Check email verification status
    if (user.email_verified !== 1 && user.is_admin !== 1) {
      return res.status(403).json({
        success: false,
        message:
          "Email not verified. Please verify your email before logging in.",
        emailVerified: false,
      });
    }

    const tokenData = await userModel.generateToken(user.uuid);
    if (!tokenData) {
      return res
        .status(401)
        .json({ success: false, message: "Token generation failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: tokenData.token,
      refreshCycles: tokenData.refreshCycles,
      expiresInMinutes: parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES),
      user: {
        email: user.email,
        is_admin: user.is_admin === 1,
        email_verified: true,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `Login failed: ${error.message}` });
  }
};

export const activateDeactivate = async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const user = await userModel.getUserByUuidWithoutActiveFilter(uuid);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newStatus = user.is_active === 1 ? 0 : 1;
    const result = await userModel.updateUserStatus(uuid, newStatus);
    if (!result) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to update user status" });
    }

    if (newStatus === 1 && user.is_active === 0) {
      await userModel.generateToken(uuid);
    }

    return res.status(200).json({
      success: true,
      message: newStatus === 0 ? "Account deactivated" : "Account activated",
      ...(newStatus === 0 && { data: { tokens_expired: true } }),
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
    const token =
      req.body.token ||
      req.body.refresh_token ||
      req.headers.authorization?.replace("Bearer ", "") ||
      req.query.token ||
      req.query.refresh_token;

    if (!tokenId && !token) {
      return res.status(400).json({
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
        tokenInfo = await query(
          "SELECT * FROM user_tokens WHERE token = ? AND is_expired = 0",
          [token]
        );

        // If not found, try by UUID
        if (!tokenInfo?.length && decodedToken?.uuid) {
          tokenInfo = await query(
            "SELECT ut.* FROM user_tokens ut JOIN users u ON ut.user_id = u.id WHERE u.uuid = ? AND ut.is_expired = 0 ORDER BY ut.id DESC LIMIT 1",
            [decodedToken.uuid]
          );
        }
      }
    }

    if (tokenId && !tokenInfo?.length) {
      tokenInfo = await query("SELECT * FROM user_tokens WHERE id = ?", [
        tokenId,
      ]);
    }

    if (!tokenInfo?.length) {
      return res.status(401).json({
        success: false,
        message:
          "Token not found or expired. Please log in again to generate a new token.",
        requiresLogin: true,
      });
    }

    const currentTokenId = tokenInfo[0].id;

    // Check if we've hit max refresh limit
    if (tokenInfo[0].refresh_cycles <= 1) {
      await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
        currentTokenId,
      ]);
      return res.status(403).json({
        success: false,
        message:
          "Maximum token refresh limit reached. Please log in again to generate a new token.",
        refreshCycles: 0,
        is_expired: 1,
        requiresLogin: true,
      });
    }

    // Generate fresh token with updated refresh count
    const refreshData = await userModel.refreshToken(currentTokenId);
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: refreshData.token,
      refreshCycles: refreshData.refreshCycles,
      expiresInMinutes: parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES) || 1,
    });
  } catch (error) {
    if (error.message.includes("max token refresh reached")) {
      const currentTokenId = req.tokenId;
      if (currentTokenId) {
        await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
          currentTokenId,
        ]);
      }
      return res.status(403).json({
        success: false,
        message:
          "Maximum token refresh limit reached. Please log in again to generate a new token.",
        refreshCycles: 0,
        is_expired: 1,
        requiresLogin: true,
      });
    }
    return res.status(401).json({
      success: false,
      message: `Token refresh failed: ${error.message}`,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Verification token is required" });
    }

    await userModel.verifyEmail(token);
    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully. You can now log in to your account.",
      email_verified: true,
    });
  } catch (error) {
    return res.status(400).json({
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
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const userData = await userModel.resendVerificationEmail(email);
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/verify-email?token=${userData.token}`;

    const emailTemplate = getVerificationEmailTemplate(
      userData.name,
      verificationUrl
    );
    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to resend verification email",
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
        .status(400)
        .json({ success: false, message: "Invalid page or limit value" });
    }

    const result = await userModel.getAllUsers(page, limit);
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
