import { query } from "../utils/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export const getUserByUuid = async (uuid) => {
  try {
    const result = await query(
      "SELECT id, uuid, name, email, is_active FROM users WHERE uuid = ? AND is_active = 1",
      [uuid]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

export const getUserByUuidWithoutActiveFilter = async (uuid) => {
  try {
    const result = await query(
      "SELECT id, uuid, name, email, is_active FROM users WHERE uuid = ?",
      [uuid]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

export const getUserByEmail = async (body) => {
  try {
    const { email } = body;
    const result = await query(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      [email]
    );
    return result?.length ? result[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user by email: ${error.message}`);
  }
};

export const createUser = async (body) => {
  try {
    const { name, email, password } = body;
    const uuid = uuidv4();
    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );

    const result = await query(
      "INSERT INTO users (uuid, name, email, password, is_active) VALUES (?, ?, ?, ?, 1)",
      [uuid, name, email, hashedPassword]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to create user");
    }
    return uuid;
  } catch (error) {
    if (
      error.message.includes("Duplicate entry") &&
      error.message.includes("email")
    ) {
      throw new Error("Email already in use");
    }
    throw new Error(`Error creating user: ${error.message}`);
  }
};

export const updateUserByUuid = async (uuid, userData) => {
  try {
    const { name, email } = userData;
    const result = await query(
      "UPDATE users SET name = ?, email = ? WHERE uuid = ? AND is_active = 1",
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

// Create JWT with configurable expiration
export const generateToken = async (userUuid) => {
  try {
    const users = await query(
      "SELECT id FROM users WHERE uuid = ? AND is_active = 1",
      [userUuid]
    );

    if (!users?.length) throw new Error("User not found or inactive");

    const userId = users[0].id;

    // Get token expiration from environment variable (default to 1 minute if not set)
    const tokenExpiresInMinutes =
      parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES) || 1;

    // Current timestamp
    const now = new Date();

    const token = jwt.sign(
      { id: userId, uuid: userUuid },
      process.env.JWT_SECRET,
      { expiresIn: `${tokenExpiresInMinutes}m` }
    );

    // Calculate exact expiration time
    const expiresAt = new Date(
      now.getTime() + tokenExpiresInMinutes * 60 * 1000
    );

    // Always set initial refresh cycles to 5
    const initialRefreshCycles = 5;

    // Create token in user_tokens table
    // First, expire any existing tokens for this user
    await query(
      "UPDATE user_tokens SET is_expired = 1 WHERE user_id = ? AND is_expired = 0",
      [userId]
    );

    // Then create a new token
    const tokenUuid = uuidv4();
    const result = await query(
      "INSERT INTO user_tokens (uuid, user_id, expires_at, is_expired, last_login_date, refresh_cycles) VALUES (?, ?, ?, 0, ?, ?)",
      [tokenUuid, userId, expiresAt, now, initialRefreshCycles]
    );

    if (!result?.affectedRows) throw new Error("Token creation failed");

    // Get the new created token ID
    const tokenData = await query("SELECT id FROM user_tokens WHERE uuid = ?", [
      tokenUuid,
    ]);

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

export const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

export const updateUserStatus = async (uuid, status) => {
  try {
    // Validate status value
    if (status !== 0 && status !== 1) {
      throw new Error("Invalid status value, must be 0 or 1");
    }

    const user = await query("SELECT id FROM users WHERE uuid = ?", [uuid]);
    if (!user?.length) throw new Error("User not found");

    const result = await query(
      "UPDATE users SET is_active = ? WHERE uuid = ?",
      [status, uuid]
    );

    if (!result?.affectedRows) throw new Error("Failed to update user status");

    // If deactivating user, expire all tokens
    if (status === 0) {
      await query(
        "UPDATE user_tokens SET is_expired = 1 WHERE user_id = ? AND is_expired = 0",
        [user[0].id]
      );
    }

    return { uuid, is_active: status };
  } catch (error) {
    throw new Error(`Error updating user status: ${error.message}`);
  }
};

export const invalidateToken = async (tokenId) => {
  try {
    // Mark token as expired
    const result = await query(
      "UPDATE user_tokens SET is_expired = 1 WHERE id = ?",
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

// Refresh token with limited cycles
export const refreshToken = async (tokenId) => {
  try {
    // First verify if the token is even eligible for refresh
    const validateToken = await query(
      "SELECT refresh_cycles FROM user_tokens WHERE id = ?",
      [tokenId]
    );

    // If token has 1 or fewer refresh cycles left, reject refresh
    if (!validateToken?.length || validateToken[0].refresh_cycles <= 1) {
      // Mark the token as expired before throwing error
      if (validateToken?.length) {
        await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
          tokenId,
        ]);
      }
      throw new Error("max token refresh reached");
    }

    // Find the token details
    const tokenData = await query(
      "SELECT ut.*, u.uuid as user_uuid FROM user_tokens ut " +
        "JOIN users u ON ut.user_id = u.id " +
        "WHERE ut.id = ? AND u.is_active = 1",
      [tokenId]
    );

    if (!tokenData?.length) throw new Error("Invalid token or user inactive");

    const token = tokenData[0];

    // Get token expiration from environment variable (default to 1 minute if not set)
    const tokenExpiresInMinutes =
      parseInt(process.env.TOKEN_EXPIRES_IN_MINUTES) || 1;

    // Generate a new token
    const newToken = jwt.sign(
      { id: token.user_id, uuid: token.user_uuid },
      process.env.JWT_SECRET,
      { expiresIn: `${tokenExpiresInMinutes}m` }
    );

    // Calculate exact expiration time
    const now = new Date();
    const newExpiresAt = new Date(
      now.getTime() + tokenExpiresInMinutes * 60 * 1000
    );

    // Decrement refresh cycles
    const newRefreshCycles = token.refresh_cycles - 1;

    // Mark the current token as expired
    await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
      tokenId,
    ]);

    // Create a new token with decremented refresh cycles
    const newTokenUuid = uuidv4();
    const result = await query(
      "INSERT INTO user_tokens (uuid, user_id, expires_at, is_expired, last_login_date, refresh_cycles) VALUES (?, ?, ?, 0, ?, ?)",
      [newTokenUuid, token.user_id, newExpiresAt, now, newRefreshCycles]
    );

    if (!result?.affectedRows) throw new Error("Token refresh failed");

    // Get the new token ID
    const newTokenData = await query(
      "SELECT id FROM user_tokens WHERE uuid = ?",
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
