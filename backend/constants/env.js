import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASS || "kalp@5503",
  DATABASE: process.env.DB_NAME || "my_db",
  PORT: parseInt(process.env.DB_PORT) || 3306,
  CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
};
// Server configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT) || 8001,
  NODE_ENV: process.env.NODE_ENV || "development",
};

// CORS configuration
export const CORS_CONFIG = {
  ORIGIN: process.env.ORIGIN_URL || "http://localhost:5173",
  CREDENTIALS: true,
};

// Frontend URL
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// JWT configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  EXPIRES_IN_MINUTES: parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES) || 60,
  MAX_REFRESH_COUNT: parseInt(process.env.MAX_REFRESH_COUNT) || 5,
};

// File upload configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/zip",
    "text/csv",
  ],
};

// Payment configuration (Stripe)
export const PAYMENT_CONFIG = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  CURRENCY: process.env.PAYMENT_CURRENCY || "inr",
};

// Email configuration
export const EMAIL_CONFIG = {
  HOST: process.env.EMAIL_HOST || "smtp.ethereal.email",
  PORT: parseInt(process.env.EMAIL_PORT) || 587,
  SECURE: process.env.EMAIL_SECURE === "true" || false,
  USER: process.env.EMAIL_USER || "",
  PASS: process.env.EMAIL_PASS || "",
  FROM_NAME: process.env.EMAIL_FROM_NAME || "E-Commerce Store",
  FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || "noreply@example.com",
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
};
