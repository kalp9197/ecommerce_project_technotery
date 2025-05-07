import jwt from "jsonwebtoken";
import { appConfig } from "../config/app.config.js";
import { query } from "./dbService.js";
import * as userModel from "../models/userModel.js";
import { sendEmail, getVerificationEmailTemplate } from "./emailService.js";

// Generate JWT token
export const generateJwtToken = (payload) => {
  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: `${appConfig.tokenExpiresInMinutes}m`,
  });
};

// Verify JWT token
export const verifyJwtToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwtSecret);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  try {
    const verificationUrl = `${appConfig.frontendUrl}/verify-email?token=${token}`;
    const emailTemplate = getVerificationEmailTemplate(
      user.name,
      verificationUrl
    );

    return await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Register a new user with verification
export const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(userData);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userUuid = await userModel.createUser(userData);
    if (!userUuid) {
      throw new Error("User registration failed");
    }

    // Get user data
    const newUser = await userModel.getUserByUuid(userUuid);

    // Get verification token
    const tokenData = await query(
      "SELECT ut.verification_token FROM user_tokens ut JOIN users u ON ut.user_id = u.id WHERE u.uuid = ? AND ut.verification_token IS NOT NULL AND ut.is_expired = 0",
      [userUuid]
    );

    // Send verification email
    if (tokenData?.length && tokenData[0].verification_token) {
      await sendVerificationEmail(newUser, tokenData[0].verification_token);
    }

    return {
      success: true,
      user: {
        email: newUser.email,
        email_verified: false,
      },
    };
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

// Resend verification email
export const resendUserVerificationEmail = async (email) => {
  try {
    const userData = await userModel.resendVerificationEmail(email);
    await sendVerificationEmail({ name: userData.name, email }, userData.token);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to resend verification email: ${error.message}`);
  }
};
