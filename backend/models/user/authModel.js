import { dbService } from "../../services/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { JWT_CONFIG } from "../../constants/index.js";
import { emailService } from "../../services/index.js";

// Create database tables if they don't exist
export const ensureUsersTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      is_admin TINYINT(1) DEFAULT 0,
      email_verified TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
  } catch (error) {
    throw new Error(`Error creating users table: ${error.message}`);
  }
};

export const ensureUserTokensTable = async () => {
  try {
    await dbService.query(`CREATE TABLE IF NOT EXISTS user_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      refresh_cycles INT DEFAULT 5,
      is_expired TINYINT(1) DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      verification_token VARCHAR(255) NULL,
      verification_token_expires TIMESTAMP NULL,
      last_login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  } catch (error) {
    throw new Error(`Error creating user_tokens table: ${error.message}`);
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

    if (!userData?.length) {
      throw new Error("User data not found");
    }

    const userId = userData[0].id;
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenUuid = uuidv4();

    await dbService.query(
      `INSERT INTO
          user_tokens (uuid, user_id, token, verification_token, verification_token_expires, expires_at)
        VALUES
          (?, ?, '', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [tokenUuid, userId, verificationToken]
    );

    return {
      user: { uuid, name, email, is_admin: adminStatus === 1 },
      verificationToken,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("User with this email already exists");
    }
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// Get user by email
export const getUserByEmail = async ({ email }) => {
  try {
    const users = await dbService.query(
      `SELECT
          *
        FROM
          users
        WHERE
          email = ? AND is_active = 1`,
      [email]
    );
    return users?.length ? users[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// Get user by UUID
export const getUserByUuid = async (uuid) => {
  try {
    const users = await dbService.query(
      `SELECT
          *
        FROM
          users
        WHERE
          uuid = ? AND is_active = 1`,
      [uuid]
    );
    return users?.length ? users[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// Get user by UUID without active filter
export const getUserByUuidWithoutActiveFilter = async (uuid) => {
  try {
    const users = await dbService.query(
      `SELECT
          *
        FROM
          users
        WHERE
          uuid = ?`,
      [uuid]
    );
    return users?.length ? users[0] : null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
};

// Verify password
export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Generate JWT token
export const generateToken = async (userUuid) => {
  try {
    const user = await getUserByUuid(userUuid);
    if (!user) throw new Error("User not found");

    const payload = {
      uuid: user.uuid,
      email: user.email,
      is_admin: user.is_admin === 1,
    };

    const token = jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: `${JWT_CONFIG.EXPIRES_IN_MINUTES}m`,
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + JWT_CONFIG.EXPIRES_IN_MINUTES
    );

    const result = await dbService.query(
      `INSERT INTO
          user_tokens (user_id, token, refresh_cycles, expires_at)
        VALUES
          (?, ?, 5, ?)`,
      [user.id, token, expiresAt]
    );

    if (!result?.affectedRows) {
      throw new Error("Failed to save token");
    }

    return { token, refreshCycles: 5 };
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

// Refresh JWT token
export const refreshToken = async (tokenId) => {
  try {
    const tokenInfo = await dbService.query(
      `SELECT
          ut.*,
          u.uuid,
          u.email,
          u.is_admin
        FROM
          user_tokens ut
        JOIN
          users u ON ut.user_id = u.id
        WHERE
          ut.id = ? AND ut.is_expired = 0`,
      [tokenId]
    );

    if (!tokenInfo?.length) {
      throw new Error("Token not found or expired");
    }

    const currentToken = tokenInfo[0];
    const refreshCycles = currentToken.refresh_cycles - 1;

    if (refreshCycles < 1) {
      throw new Error("Maximum token refresh limit reached");
    }

    const payload = {
      uuid: currentToken.uuid,
      email: currentToken.email,
      is_admin: currentToken.is_admin === 1,
    };

    const newToken = jwt.sign(payload, JWT_CONFIG.SECRET, {
      expiresIn: `${JWT_CONFIG.EXPIRES_IN_MINUTES}m`,
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + JWT_CONFIG.EXPIRES_IN_MINUTES
    );

    await dbService.query(
      `UPDATE
          user_tokens
        SET
          token = ?,
          refresh_cycles = ?,
          expires_at = ?
        WHERE
          id = ?`,
      [newToken, refreshCycles, expiresAt, tokenId]
    );

    return { token: newToken, refreshCycles };
  } catch (error) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
};

// Update user status
export const updateUserStatus = async (uuid, status) => {
  try {
    const result = await dbService.query(
      `UPDATE
          users
        SET
          is_active = ?
        WHERE
          uuid = ?`,
      [status, uuid]
    );

    if (status === 0) {
      await dbService.query(
        `UPDATE
            user_tokens ut
          JOIN
            users u ON ut.user_id = u.id
          SET
            ut.is_expired = 1
          WHERE
            u.uuid = ?`,
        [uuid]
      );
    }

    return result?.affectedRows > 0;
  } catch (error) {
    throw new Error(`Error updating user status: ${error.message}`);
  }
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    const tokenInfo = await dbService.query(
      `SELECT
          ut.*,
          u.id as user_id,
          u.email_verified
        FROM
          user_tokens ut
        JOIN
          users u ON ut.user_id = u.id
        WHERE
          ut.verification_token = ? AND ut.is_expired = 0 AND ut.verification_token_expires > NOW()`,
      [token]
    );

    if (!tokenInfo?.length) {
      throw new Error("Invalid or expired verification token");
    }

    const { user_id, email_verified } = tokenInfo[0];

    if (email_verified === 1) {
      throw new Error("Email already verified");
    }

    await dbService.query(
      `UPDATE
          users
        SET
          email_verified = 1
        WHERE
          id = ?`,
      [user_id]
    );

    await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          verification_token = ?`,
      [token]
    );

    return true;
  } catch (error) {
    throw new Error(`Email verification failed: ${error.message}`);
  }
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
  try {
    const user = await dbService.query(
      `SELECT
          *
        FROM
          users
        WHERE
          email = ?`,
      [email]
    );

    if (!user?.length) {
      throw new Error("User not found");
    }

    if (user[0].email_verified === 1) {
      throw new Error("Email already verified");
    }

    // Expire any existing verification tokens
    await dbService.query(
      `UPDATE
          user_tokens
        SET
          is_expired = 1
        WHERE
          user_id = ?`,
      [user[0].id]
    );

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenUuid = uuidv4();

    await dbService.query(
      `INSERT INTO
          user_tokens (uuid, user_id, token, verification_token, verification_token_expires, expires_at)
        VALUES
          (?, ?, '', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [tokenUuid, user[0].id, verificationToken]
    );

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await emailService.sendEmail({
      to: email,
      subject: "Email Verification",
      html: `<p>Please click the link below to verify your email:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
    });

    return true;
  } catch (error) {
    throw new Error(`Failed to resend verification email: ${error.message}`);
  }
};
