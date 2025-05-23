import jwt from "jsonwebtoken";
import { appConfig } from "../config/app.config.js";
import * as userModel from "../models/userModel.js";
import { sendEmail, getVerificationEmailTemplate } from "./emailService.js";

export const generateJwtToken = (payload) => {
  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: `${appConfig.tokenExpiresInMinutes}m`,
  });
};

export const verifyJwtToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwtSecret);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

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
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const registerUser = async (userData) => {
  try {
    // createUser in userModel now handles checks for existing verified users
    // and manages unverified temp_users entries.
    const tempUserData = await userModel.createUser(userData);
    if (!tempUserData || !tempUserData.uuid || !tempUserData.verification_token) {
      throw new Error("User registration failed to return necessary data.");
    }

    // Send verification email using data from temp_users creation
    await sendVerificationEmail(
      { name: tempUserData.name, email: tempUserData.email },
      tempUserData.verification_token
    );

    return {
      success: true,
      user: { // Return info about the temporary user
        email: tempUserData.email,
        email_verified: false, // By definition, this user is not yet verified
      },
    };
  } catch (error) {
    // More specific error handling can be done here if needed, or let it propagate
    throw new Error(`Registration failed: ${error.message}`);
  }
};

export const resendUserVerificationEmail = async (email) => {
  try {
    const userData = await userModel.resendVerificationEmail(email);
    await sendVerificationEmail({ name: userData.name, email }, userData.token);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to resend verification email: ${error.message}`);
  }
};
