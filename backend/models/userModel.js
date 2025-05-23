import { dbService } from "../services/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { JWT_CONFIG } from "../constants/index.js";

// Initialize users table if not exists
export const ensureUsersTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                        INT AUTO_INCREMENT PRIMARY KEY,
      uuid                      VARCHAR(36) NOT NULL UNIQUE,
      name                      VARCHAR(100) NOT NULL,
      email                     VARCHAR(100) NOT NULL UNIQUE,
      password                  VARCHAR(255) NOT NULL,
      is_active                 BOOLEAN     NOT NULL DEFAULT TRUE,
      is_admin                  BOOLEAN     NOT NULL DEFAULT FALSE,
      email_verified            BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
  } catch (error) {
    throw new Error(`Error creating users table: ${error.message}`);
  }
};

// Initialize temp_users table if not exists
export const ensureTempUsersTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS temp_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      verification_token VARCHAR(255) NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
  } catch (error) {
    throw new Error(`Error creating temp_users table: ${error.message}`);
  }
};

// Initialize user_tokens table if not exists
export const ensureUserTokensTable = async () => {
  try {
    await dbService.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      id                        INT AUTO_INCREMENT PRIMARY KEY,
      uuid                      VARCHAR(36) NOT NULL UNIQUE,
      user_id                   INT         NOT NULL,
      token                     TEXT        NULL,
      expires_at                TIMESTAMP   NOT NULL,
      is_expired                BOOLEAN     NOT NULL DEFAULT FALSE,
      last_login_date           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      refresh_cycles            INT         NOT NULL DEFAULT 5,
      verification_token        VARCHAR(255) NULL,
      verification_token_expires TIMESTAMP   NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating user_tokens table: ${error.message}`);
  }
};

// Get active user by UUID
export const getUserByUuid = async (uuid) => {
  try {
    const result = await dbService.query(
      `SELECT
          id,
          uuid,
          name,
          email,
          is_active,
          is_admin
        FROM
          users
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// Get user by UUID regardless of active status
export const getUserByUuidWithoutActiveFilter = async (uuid) => {
  try {
    const result = await dbService.query(
      `SELECT
          id,
          uuid,
          name,
          email,
          is_active,
          is_admin
        FROM
          users
        WHERE
          uuid = ?`,
      [uuid]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// Find user by email address
export const getUserByEmail = async (body) => {
  try {
    const { email } = body;
    const result = await dbService.query(
      `SELECT
          *
        FROM
          users
        WHERE
          email = ? AND is_active = 1`,
      [email]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user by email: ${error.message}`);
  }
};

// Confirm user email with token
export const verifyEmail = async (token) => {
  try {
    const [tempUser] = await dbService.query(
      `SELECT * FROM temp_users WHERE verification_token = ? AND is_verified = 0 AND expires_at > NOW()`,
      [token]
    );

    if (!tempUser) throw new Error("Invalid or expired verification token.");

    // Start transaction
    const connection = await dbService.beginTransaction();
    let userUuid;
    try {
      // Insert into users table
      const createUserResult = await dbService.queryWithConnection(
        connection,
        `INSERT INTO users (uuid, name, email, password, is_active, is_admin, email_verified) VALUES (?, ?, ?, ?, 1, 0, 1)`,
        [tempUser.uuid, tempUser.name, tempUser.email, tempUser.password]
      );

      if (!createUserResult?.affectedRows) {
        throw new Error("Failed to create user during verification");
      }
      userUuid = tempUser.uuid;

      // Mark temp_user as verified
      await dbService.queryWithConnection(
        connection,
        `UPDATE temp_users SET is_verified = 1 WHERE id = ?`,
        [tempUser.id]
      );

      await dbService.commit(connection);
    } catch (transactionError) {
      await dbService.rollback(connection);
      throw new Error(
        `Verification process failed: ${transactionError.message}`
      );
    }

    return userUuid;
  } catch (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }
};

// Register new user account
export const createUser = async (body) => {
  try {
    const { name, email, password } = body;

    // Check if email already exists in users table (verified user)
    const [existingVerifiedUser] = await dbService.query(
      `SELECT id FROM users WHERE email = ? AND email_verified = 1`,
      [email]
    );
    if (existingVerifiedUser) {
      throw new Error("User with this email already exists and is verified.");
    }

    // If email exists in temp_users and is not verified, delete it to allow re-registration
    await dbService.query(
      `DELETE FROM temp_users WHERE email = ? AND is_verified = 0`,
      [email]
    );

    const uuid = uuidv4();
    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    const result = await dbService.query(
      `INSERT INTO temp_users (uuid, name, email, password, verification_token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid, name, email, hashedPassword, verificationToken, expiresAt]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create temporary user entry.");
    }

    return { uuid, name, email, verification_token: verificationToken };
  } catch (error) {
    // Check for email uniqueness constraint violation
    if (
      error.message.includes("Duplicate entry") &&
      error.message.includes("email")
    ) {
      throw new Error("Email already in use for a temporary registration.");
    }
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// Update user profile data
export const updateUserByUuid = async (uuid, userData) => {
  try {
    const { name, email } = userData;
    const result = await dbService.query(
      `UPDATE
          users
        SET
          name = ?,
          email = ?
        WHERE
          uuid = ? AND is_active = 1`,
      [name, email, uuid]
    );

    if (!result?.affectedRows) {
      throw new Error("User not found or update failed");
    }
    return { uuid, updated: true };
  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
};

// Generates JWT auth token with refresh cycle limit (default: 5)
// Invalidates all previous tokens for the user for security
export const generateToken = async (userUuid) => {
  try {
    const users = await dbService.query(
      `SELECT
          id
        FROM
          users
        WHERE
          uuid = ? AND is_active = 1`,
      [userUuid]
    );

    if (!users?.length) throw new Error("User not found or inactive");

    const userId = users[0].id;
    const tokenExpiresInMinutes = JWT_CONFIG.EXPIRES_IN_MINUTES;
    const now = new Date();
    // Create JWT with user identifiers
    const token = jwt.sign({ id: userId, uuid: userUuid }, JWT_CONFIG.SECRET, {
      expiresIn: `${tokenExpiresInMinutes}m`,
    });
    const expiresAt = new Date(
      now.getTime() + tokenExpiresInMinutes * 60 * 1000
    );
    const initialRefreshCycles = 5;

    // Invalidate all existing tokens for security
    await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          user_id = ? AND is_expired = 0`,
      [userId]
    );

    // Create new token record
    const tokenUuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          user_tokens (uuid, user_id, token, expires_at, is_expired, last_login_date, refresh_cycles)
        VALUES
          (?, ?, ?, ?, 0, ?, ?)`,
      [tokenUuid, userId, token, expiresAt, now, initialRefreshCycles]
    );

    if (!result?.affectedRows) throw new Error("Token creation failed");

    const tokenData = await dbService.query(
      `SELECT
          id
        FROM
          user_tokens
        WHERE
          uuid = ?`,
      [tokenUuid]
    );

    if (!tokenData?.length) throw new Error("Failed to retrieve token ID");

    return {
      token,
      tokenId: tokenData[0].id,
      refreshCycles: initialRefreshCycles,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes: tokenExpiresInMinutes,
    };
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

// Securely verify password against stored hash
export const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

// Activate or deactivate user account
export const updateUserStatus = async (uuid, status) => {
  try {
    if (status !== 0 && status !== 1) {
      throw new Error("Invalid status value, must be 0 or 1");
    }

    const user = await dbService.query(
      `SELECT
          id
        FROM
          users
        WHERE
          uuid = ?`,
      [uuid]
    );
    if (!user?.length) throw new Error("User not found");

    const result = await dbService.query(
      `UPDATE
          users
        SET
          is_active = ?
        WHERE
          uuid = ?`,
      [status, uuid]
    );

    if (!result?.affectedRows) throw new Error("Failed to update user status");

    // Invalidate all tokens if user is deactivated
    if (status === 0) {
      await dbService.query(
        `UPDATE
            user_tokens
          SET
            is_expired = 1
          WHERE
            user_id = ? AND is_expired = 0`,
        [user[0].id]
      );
    }

    return { uuid, is_active: status };
  } catch (error) {
    throw new Error(`Error updating user status: ${error.message}`);
  }
};

// Mark token as expired/invalid
export const invalidateToken = async (tokenId) => {
  try {
    const result = await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          id = ?`,
      [tokenId]
    );

    if (!result?.affectedRows) {
      throw new Error("No active token found or failed to invalidate");
    }

    return true;
  } catch (error) {
    throw new Error(`Error invalidating token: ${error.message}`);
  }
};

// Refresh user token for continued access
export const refreshToken = async (tokenId) => {
  try {
    // Check if token has remaining refresh cycles
    const validateToken = await dbService.query(
      `SELECT
          refresh_cycles
        FROM
          user_tokens
        WHERE
          id = ?`,
      [tokenId]
    );

    if (!validateToken?.length || validateToken[0].refresh_cycles <= 1) {
      if (validateToken?.length) {
        await dbService.query(
          `UPDATE
              user_tokens
            SET
              is_expired = 1
            WHERE
              id = ?`,
          [tokenId]
        );
      }
      throw new Error("max token refresh reached");
    }

    // Get token and associated user data
    const tokenData = await dbService.query(
      `SELECT
          ut.*,
          u.uuid as user_uuid
        FROM
          user_tokens ut
        JOIN
          users u ON ut.user_id = u.id
        WHERE
          ut.id = ? AND u.is_active = 1`,
      [tokenId]
    );

    if (!tokenData?.length) throw new Error("Invalid token or user inactive");

    const token = tokenData[0];
    const tokenExpiresInMinutes = JWT_CONFIG.EXPIRES_IN_MINUTES;
    // Generate new JWT
    const newToken = jwt.sign(
      { id: token.user_id, uuid: token.user_uuid },
      JWT_CONFIG.SECRET,
      { expiresIn: `${tokenExpiresInMinutes}m` }
    );

    const now = new Date();
    const newExpiresAt = new Date(
      now.getTime() + tokenExpiresInMinutes * 60 * 1000
    );
    const newRefreshCycles = token.refresh_cycles - 1;

    // Invalidate current token
    await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          id = ?`,
      [tokenId]
    );

    // Create new token record with decremented refresh count
    const newTokenUuid = uuidv4();
    const result = await dbService.query(
      `INSERT INTO
          user_tokens (uuid, user_id, token, expires_at, is_expired, last_login_date, refresh_cycles)
        VALUES
          (?, ?, ?, ?, 0, ?, ?)`,
      [
        newTokenUuid,
        token.user_id,
        newToken,
        newExpiresAt,
        now,
        newRefreshCycles,
      ]
    );

    if (!result?.affectedRows) throw new Error("Token refresh failed");

    const newTokenData = await dbService.query(
      `SELECT
          id
        FROM
          user_tokens
        WHERE
          uuid = ?`,
      [newTokenUuid]
    );

    if (!newTokenData?.length)
      throw new Error("Failed to retrieve new token ID");

    return {
      token: newToken,
      tokenId: newTokenData[0].id,
      refreshCycles: newRefreshCycles,
      expiresInMinutes: tokenExpiresInMinutes,
    };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

// Resend verification email to user
export const resendVerificationEmail = async (email) => {
  try {
    // Check if user is already verified in the main users table
    const [verifiedUser] = await dbService.query(
      `SELECT id, name, email_verified FROM users WHERE email = ? AND is_active = 1`,
      [email]
    );

    if (verifiedUser && verifiedUser.email_verified) {
      throw new Error("Email is already verified");
    }

    // Check temp_users for an unverified registration
    const [tempUser] = await dbService.query(
      `SELECT id, uuid, name FROM temp_users WHERE email = ? AND is_verified = 0`,
      [email]
    );

    if (!tempUser) {
      throw new Error(
        "No pending registration found for this email, or registration expired. Please register again."
      );
    }

    // Generate new token and expiry for temp_user
    const newVerificationToken = crypto.randomBytes(32).toString("hex");
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 24);

    await dbService.query(
      `UPDATE temp_users SET verification_token = ?, expires_at = ? WHERE id = ?`,
      [newVerificationToken, newExpiresAt, tempUser.id]
    );

    return {
      userUuid: tempUser.uuid, // or tempUser.uuid
      name: tempUser.name,
      token: newVerificationToken,
    };
  } catch (error) {
    throw new Error(`Failed to resend: ${error.message}`);
  }
};

// Get paginated list of users for admin panel
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const users = await dbService.query(
      `SELECT
          uuid,
          name,
          email,
          is_active
        FROM
          users
        WHERE
          is_active = 1 AND is_admin = 0
        ORDER BY
          id DESC
        LIMIT
          ${limit}
        OFFSET
          ${offset}`
    );

    if (!users?.length) throw new Error("No users found");
    return { users };
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};
