import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { appConfig, rateLimiter } from "./config/app.config.js";
import { dbService } from "./services/index.js";
import { HTTP_STATUS } from "./constants/index.js";
import {
  // User routes
  authRoutes,
  cartRoutes,
  wishlistRoutes,
  reviewRoutes,
  // Admin routes
  userRoutes as adminUserRoutes,
  adminProductRoutes,
  adminCategoryRoutes,
  fileUploadRoutes,
  paymentRoutes as adminPaymentRoutes,
  // Public routes
  productRoutes,
  categoryRoutes,
  emailTestRoutes,
} from "./routes/index.js";

// Setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

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

// API routes
// User routes
app.use("/api/users", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

// Admin routes
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/files", fileUploadRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);

// Public routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/email-test", emailTestRoutes);

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
    message: err.message || "Internal server error",
  });
});

export default app;
