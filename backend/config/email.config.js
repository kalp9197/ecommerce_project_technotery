import nodemailer from "nodemailer";
import { EMAIL_CONFIG } from "../constants/index.js";

// Email configuration for development
const createDevTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    testAccount,
  };
};

// Email configuration for production
const createProdTransporter = () => {
  return {
    transporter: nodemailer.createTransport({
      host: EMAIL_CONFIG.HOST,
      port: EMAIL_CONFIG.PORT,
      secure: EMAIL_CONFIG.SECURE,
      auth: {
        user: EMAIL_CONFIG.USER,
        pass: EMAIL_CONFIG.PASS,
      },
    }),
  };
};

// Default email sender
const defaultSender = `"${EMAIL_CONFIG.FROM_NAME}" <${EMAIL_CONFIG.FROM_EMAIL}>`;

export { createDevTransporter, createProdTransporter, defaultSender };
