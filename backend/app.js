import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { appConfig, rateLimiter } from "./config/app.config.js";
import { dbService } from "./services/index.js";
import { HTTP_STATUS } from "./constants/index.js";
import {
  userRoutes,
  productCategoryRoutes as categoryRoutes,
  productRoutes,
  cartRoutes,
  paymentRoutes,
  productReviewRoutes as reviewRoutes,
  fileUploadRoutes,
  emailTestRoutes,
  wishlistRoutes,
  userAnalyticsRoutes,
  recommendationRoutes,
} from "./routes/index.js";
import {
  processCacheInvalidationEvents,
  refreshProductCache,
} from "./middlewares/cacheInvalidation.js";
import ProductService from "./services/product.Service.js";
import { initializeGeminiClient } from "./services/geminiService.js";

// Setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Initialize Gemini Client (non-blocking, logs errors)
initializeGeminiClient();

// Configure CORS
app.use(cors({ origin: appConfig.corsOrigin, credentials: true }));

// Parse JSON for all routes except webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") next();
  else express.json()(req, res, next);
});

// Request parsers and static file setup
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB connection and rate limiting
dbService.testConnection();
app.use(rateLimiter);

// Initialize services and attach to app locals
const productService = new ProductService();
app.locals.productService = productService;

// Add cache invalidation middleware to process events on each request
app.use(processCacheInvalidationEvents);
app.use(refreshProductCache);

// API routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/files", fileUploadRoutes);
app.use("/api/email-test", emailTestRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/analytics", userAnalyticsRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Handle undefined routes
app.all("*", (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message,
  });
});

export default app;
