import mysql from "mysql2/promise";
import { DB_CONFIG } from "../constants/index.js";

// Database connection parameters
const dbConfig = {
  host: DB_CONFIG.HOST,
  user: DB_CONFIG.USER,
  password: DB_CONFIG.PASSWORD,
  database: DB_CONFIG.DATABASE,
  waitForConnections: true,
  connectionLimit: DB_CONFIG.CONNECTION_LIMIT,
  queueLimit: 0,
};

// For initial database creation
const createDbPool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
});

// Main connection pool
const pool = mysql.createPool(dbConfig);

export { dbConfig, createDbPool, pool };
