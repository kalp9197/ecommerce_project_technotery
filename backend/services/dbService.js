import { pool, createDbPool } from "../config/db.config.js";
import { DB_CONFIG } from "../constants/index.js";

// Initialize database if it doesn't exist
const initializeDatabase = async () => {
  try {
    await createDbPool.query(
      `CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.DATABASE}`
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to create database: ${error.message}`);
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await initializeDatabase();
    const connection = await pool.getConnection();
    console.log("Database connection successful");
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection error:", error.message);
    return false;
  }
};

// Execute a query
const query = async (sql, params) => {
  try {
    // If params are not provided, use query() instead of execute()
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

// Start a transaction
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Execute a query within a transaction
const queryWithConnection = async (connection, sql, params) => {
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    throw new Error(`Query error: ${error.message}`);
  }
};

// Commit a transaction
const commit = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
};

// Rollback a transaction
const rollback = async (connection) => {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
};

// Update expired tokens in the database
const updateExpiredTokens = async () => {
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

export {
  initializeDatabase,
  testConnection,
  query,
  beginTransaction,
  queryWithConnection,
  commit,
  rollback,
  updateExpiredTokens,
};
