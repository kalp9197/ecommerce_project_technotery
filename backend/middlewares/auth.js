import jwt from "jsonwebtoken";
import { query, updateExpiredTokens } from "../utils/db.js";

const verifyToken = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Access denied. No token provided", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  try {
    // Extract user UUID and verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.decodedToken = decoded;

    if (!decoded || !decoded.uuid) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const userUuid = decoded.uuid;

    // Check if user exists and is active
    const userData = await query(
      "SELECT * FROM users WHERE uuid = ? AND is_active = 1",
      [userUuid]
    );

    if (!userData || !userData.length) {
      return { error: "User not found or inactive", status: 404 };
    }

    // Add user ID to decoded object
    req.decodedToken.id = userData[0].id;

    // Get user's active token
    const tokens = await query(
      "SELECT ut.* FROM user_tokens ut " +
        "JOIN users u ON ut.user_id = u.id " +
        "WHERE u.uuid = ? AND ut.is_expired = 0 ORDER BY ut.id DESC LIMIT 1",
      [userUuid]
    );

    if (!tokens || !tokens.length) {
      // Try to find a refreshable token
      const refreshableTokens = await query(
        "SELECT ut.* FROM user_tokens ut " +
          "JOIN users u ON ut.user_id = u.id " +
          "WHERE u.uuid = ? AND ut.refresh_cycles > 0 ORDER BY ut.id DESC LIMIT 1",
        [userUuid]
      );

      if (refreshableTokens?.length) {
        return {
          error: "Token expired but can be refreshed",
          status: 401,
          canRefresh: true,
          tokenId: refreshableTokens[0].id,
          refreshCycles: refreshableTokens[0].refresh_cycles,
          is_expired: 1,
        };
      }

      return { error: "No active token found for user", status: 404 };
    }

    const userToken = tokens[0];

    // Check if token has expired
    const expiresAt = new Date(userToken.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      await query("UPDATE user_tokens SET is_expired = 1 WHERE id = ?", [
        userToken.id,
      ]);

      // Check if token can be refreshed
      if (userToken.refresh_cycles > 0) {
        return {
          error: "Token expired but can be refreshed",
          status: 401,
          canRefresh: true,
          tokenId: userToken.id,
          refreshCycles: userToken.refresh_cycles,
          is_expired: 1,
        };
      }

      return {
        error: "Token has expired",
        status: 401,
        is_expired: 1,
      };
    }

    // Store token info
    req.tokenId = userToken.id;
    req.refreshCycles = userToken.refresh_cycles;
    req.isExpired = 0;

    return {
      decoded: req.decodedToken,
      tokenId: userToken.id,
      is_expired: 0,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // When JWT is expired, check if we can refresh
      const decoded = jwt.decode(token);
      if (decoded && decoded.uuid) {
        const refreshableTokens = await query(
          "SELECT ut.* FROM user_tokens ut " +
            "JOIN users u ON ut.user_id = u.id " +
            "WHERE u.uuid = ? AND ut.refresh_cycles > 0 ORDER BY ut.id DESC LIMIT 1",
          [decoded.uuid]
        );

        if (refreshableTokens?.length) {
          return {
            error: "Token expired but can be refreshed",
            status: 401,
            canRefresh: true,
            tokenId: refreshableTokens[0].id,
            refreshCycles: refreshableTokens[0].refresh_cycles,
            is_expired: 1,
          };
        }
      }
      return { error: "Token has expired", status: 401, is_expired: 1 };
    }
    return { error: "Authentication error", status: 500 };
  }
};

export const authenticate = async (req, res, next) => {
  try {
    // Update any expired tokens in the database
    await updateExpiredTokens();

    // Special handling for refresh-token endpoint
    if (req.originalUrl.includes("/refresh-token")) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.decode(token);

        if (decoded && decoded.uuid) {
          const refreshableTokens = await query(
            "SELECT ut.* FROM user_tokens ut " +
              "JOIN users u ON ut.user_id = u.id " +
              "WHERE u.uuid = ? AND ut.refresh_cycles > 0 ORDER BY ut.id DESC LIMIT 1",
            [decoded.uuid]
          );

          if (refreshableTokens?.length) {
            const userToken = refreshableTokens[0];
            req.tokenId = userToken.id;
            req.refreshCycles = userToken.refresh_cycles;
            req.user = decoded;
            req.is_expired = 1;

            // Get and add user id
            const userData = await query(
              "SELECT id FROM users WHERE uuid = ? AND is_active = 1",
              [decoded.uuid]
            );
            if (userData && userData.length > 0) {
              req.user.id = userData[0].id;
            }

            return next();
          }
        }
      }
    }

    // Standard auth
    const result = await verifyToken(req);
    if (result.error) {
      // Tell client to refresh their token if possible
      if (result.canRefresh) {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please refresh your token.",
          requiresRefresh: true,
          is_expired: 1,
          tokenId: result.tokenId,
          refreshCycles: result.refreshCycles,
        });
      }

      return res.status(result.status).json({
        success: false,
        message: result.error,
        is_expired: result.is_expired !== undefined ? result.is_expired : 1,
      });
    }

    // Auth successful, set user data for route handlers
    req.user = result.decoded;
    req.tokenId = result.tokenId;
    req.is_expired = result.is_expired || 0;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
      is_expired: 1,
    });
  }
};
