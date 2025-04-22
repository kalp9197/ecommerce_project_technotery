import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const createDbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
});

const initializeDatabase = async () => {
  try {
    await createDbPool.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
  } catch (error) {
    throw new Error(`Failed to create database: ${error.message}`);
  }
};

// Main connection pool with database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testConnection = async () => {
  try {
    await initializeDatabase();
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
};

const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    throw new Error(`Query error: ${error.message}`);
  }
};

export { pool, query, testConnection };

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
