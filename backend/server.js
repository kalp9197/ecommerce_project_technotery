import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./utils/db.js";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/productCategoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// Get dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Configure CORS for multiple environments
const allowedOrigins = [
  process.env.ORIGIN_URL,
  "http://localhost:5173", // Local development
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
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

// Add health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

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

// Start server
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
