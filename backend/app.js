import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Import configurations
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
} from "./routes/index.js";

// Get dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// CORS configuration
app.use(
  cors({
    origin: appConfig.corsOrigin,
    credentials: true,
  })
);

// Parse JSON for all routes EXCEPT /api/payments/webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));
// Serve static files from backend/uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test database connection
dbService.testConnection();

// Apply rate limiting middleware
app.use(rateLimiter);

// API routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/files", fileUploadRoutes);
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
