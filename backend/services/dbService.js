import { pool, createDbPool } from "../config/db.config.js";
import { DB_CONFIG } from "../constants/index.js";

// Create database if it doesn't exist
export const initializeDatabase = async () => {
  try {
    await createDbPool.query(
      `CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.DATABASE}`
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to create database: ${error.message}`);
  }
};

// Initialize all database tables
export const initializeTables = async () => {
  try {
    // Import all model initialization functions
    const { ensureUsersTable, ensureUserTokensTable } = await import(
      "../models/userModel.js"
    );

    const { ensureProductCategoriesTable } = await import(
      "../models/productCategoryModel.js"
    );

    const { ensureProductsTable } = await import("../models/productModel.js");

    const { ensureProductImagesTable } = await import(
      "../models/productImageModel.js"
    );

    const { ensureCartTable, ensureCartItemsTable } = await import(
      "../models/cartModel.js"
    );

    const { ensureProductReviewsTable } = await import(
      "../models/productReviewModel.js"
    );

    const { ensureWishlistTable, ensureWishlistItemsTable } = await import(
      "../models/wishlistModel.js"
    );

    // Create tables in the correct order (respecting foreign key constraints)
    await ensureUsersTable();
    await ensureUserTokensTable();
    await ensureProductCategoriesTable();
    await ensureProductsTable();
    await ensureProductImagesTable();
    await ensureCartTable();
    await ensureCartItemsTable();
    await ensureProductReviewsTable();
    await ensureWishlistTable();
    await ensureWishlistItemsTable();

    console.log("All database tables initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database tables:", error.message);
    return false;
  }
};

// Verify database connectivity and initialize tables
export const testConnection = async () => {
  try {
    await initializeDatabase();
    const connection = await pool.getConnection();
    console.log("Database connection successful");
    connection.release();

    // Initialize tables after successful connection
    await initializeTables();

    return true;
  } catch (error) {
    console.error("Database connection error:", error.message);
    return false;
  }
};

// Execute SQL query with optional parameters
export const query = async (sql, params) => {
  try {
    if (!params || params.length === 0) {
      const [results] = await pool.query(sql);
      return results;
    } else {
      const [results] = await pool.execute(sql, params);
      return results;
    }
  } catch (error) {
    throw new Error(`Query error: ${error.message}`);
  }
};

// Start a database transaction
export const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Execute SQL with an active connection
export const queryWithConnection = async (connection, sql, params) => {
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    throw new Error(`Query error: ${error.message}`);
  }
};

// Commit database transaction
export const commit = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
};

// Rollback database transaction
export const rollback = async (connection) => {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
};

// Mark expired auth tokens as invalid
export const updateExpiredTokens = async () => {
  const now = new Date().toISOString();
  try {
    const result = await query(
      "UPDATE user_tokens SET is_expired = 1 WHERE expires_at < ? AND is_expired = 0",
      [now]
    );
    return result?.affectedRows || 0;
  } catch (error) {
    return 0;
  }
};
