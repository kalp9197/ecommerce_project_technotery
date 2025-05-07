import { dbService } from "../services/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { JWT_CONFIG } from "../constants/index.js";

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

// Create email verification token
export const generateVerificationToken = async (userId) => {
  try {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    const tokenUuid = uuidv4();

    // Invalidate any existing verification tokens for this user
    await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          user_id = ? AND verification_token IS NOT NULL`,
      [userId]
    );

    const result = await dbService.query(
      `INSERT INTO
          user_tokens (uuid, user_id, expires_at, is_expired, verification_token, verification_token_expires)
        VALUES
          (?, ?, ?, 0, ?, ?)`,
      [tokenUuid, userId, expires, token, expires]
    );

    if (!result?.affectedRows)
      throw new Error("Verification token creation failed");

    return token;
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

// Confirm user email with token
export const verifyEmail = async (token) => {
  try {
    // Verify token is valid, not expired, and belongs to an active user
    const tokenData = await dbService.query(
      `SELECT
          ut.user_id,
          u.uuid
        FROM
          user_tokens ut
        JOIN
          users u ON ut.user_id = u.id
        WHERE
          ut.verification_token = ? AND ut.verification_token_expires > NOW() AND ut.is_expired = 0`,
      [token]
    );

    if (!tokenData?.length) throw new Error("Invalid or expired token");

    // Mark user email as verified
    await dbService.query(
      `UPDATE
          users
        SET
          email_verified = 1
        WHERE
          id = ?`, 
      [tokenData[0].user_id]
    );

    // Invalidate the used token
    await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          user_id = ? AND verification_token IS NOT NULL`,
      [tokenData[0].user_id]
    );

    return tokenData[0].uuid;
  } catch (error) {
    throw new Error(`Verification failed: ${error.message}`);
  }
};

// Register new user account
export const createUser = async (body) => {
  try {
    const { name, email, password, is_admin } = body;
    const uuid = uuidv4();
    // Securely hash password with salt
    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );
    const adminStatus = is_admin === 1 || is_admin === true ? 1 : 0;

    const result = await dbService.query(
      `INSERT INTO
          users (uuid, name, email, password, is_active, is_admin, email_verified)
        VALUES
          (?, ?, ?, ?, 1, ?, 0)`,
      [uuid, name, email, hashedPassword, adminStatus]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create user");
    }

    // Create verification token for email confirmation
    const userData = await dbService.query(
      `SELECT
          id
        FROM
          users
        WHERE
          uuid = ?`,
      [uuid]
    );
    if (userData?.length) {
      await generateVerificationToken(userData[0].id);
    }

    return uuid;
  } catch (error) {
    // Check for email uniqueness constraint violation
    if (
      error.message.includes("Duplicate entry") &&
      error.message.includes("email")
    ) {
      throw new Error("Email already in use");
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
    const users = await dbService.query(
      `SELECT
          id,
          uuid,
          name,
          email_verified
        FROM
          users
        WHERE
          email = ? AND is_active = 1`,
      [email]
    );

    if (!users?.length) throw new Error("User not found");
    if (users[0].email_verified === 1) {
      throw new Error("Email is already verified");
    }

    const token = await generateVerificationToken(users[0].id);
    return {
      userUuid: users[0].uuid,
      name: users[0].name,
      token,
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
