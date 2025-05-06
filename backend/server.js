import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./utils/db.js";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/productCategoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/productReviewRoutes.js";
import fileUploadRoutes from "./routes/fileUploadRoutes.js";
import emailTestRoutes from "./routes/emailTestRoutes.js";
import rateLimit from "express-rate-limit";

// Get dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN_URL,
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

testConnection();

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
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 min
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Start server
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
