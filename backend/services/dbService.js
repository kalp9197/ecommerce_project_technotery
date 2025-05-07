import { pool, createDbPool } from "../config/db.config.js";
import { DB_CONFIG } from "../constants/index.js";

// Create database if it doesn't exist
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

// Verify database connectivity
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

// Execute SQL query with optional parameters
const query = async (sql, params) => {
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
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Execute SQL with an active connection
const queryWithConnection = async (connection, sql, params) => {
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    throw new Error(`Query error: ${error.message}`);
  }
};

// Commit database transaction
const commit = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
};

// Rollback database transaction
const rollback = async (connection) => {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
};

// Mark expired auth tokens as invalid
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
