import rateLimit from "express-rate-limit";
import {
  SERVER_CONFIG,
  CORS_CONFIG,
  FRONTEND_URL,
  JWT_CONFIG,
  RATE_LIMIT_CONFIG,
} from "../constants/index.js";

// Core app configuration settings
const appConfig = {
  port: SERVER_CONFIG.PORT,
  corsOrigin: CORS_CONFIG.ORIGIN,
  frontendUrl: FRONTEND_URL,
  jwtSecret: JWT_CONFIG.SECRET,
  tokenExpiresInMinutes: JWT_CONFIG.EXPIRES_IN_MINUTES,
  maxRefreshCount: JWT_CONFIG.MAX_REFRESH_COUNT,
};

// API rate limiter to prevent abuse
const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});

export { appConfig, rateLimiter };
