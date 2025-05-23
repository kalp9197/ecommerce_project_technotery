import { pool } from "../config/db.config.js";
import { redis, CACHE_KEYS, getVersionedKey } from "../config/redis.js";

// Process cache invalidation events on each API request
export const processCacheInvalidationEvents = async (req, res, next) => {
  let connection;
  try {
    // Get connection from pool
    connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Find unprocessed events
    const [events] = await connection.query(
      "SELECT * FROM cache_invalidation_events WHERE processed = FALSE ORDER BY event_time LIMIT 5"
    );

    if (events.length > 0) {
      // Process each event
      for (const event of events) {
        try {
          if (event.event_type === "product_update") {
            // Get versioned cache keys for all product-related caches
            const productKeys = [
              await getVersionedKey(CACHE_KEYS.PRODUCTS_PAGE_1),
              await getVersionedKey(CACHE_KEYS.FEATURED_PRODUCTS),
            ];

            // Delete all product-related caches
            for (const key of productKeys) {
              await redis.del(key);
            }

            // Mark event as processed
            await connection.query(
              "UPDATE cache_invalidation_events SET processed = TRUE WHERE id = ?",
              [event.id]
            );
          }
        } catch {
          // Silently continue with next event if one fails
        }
      }
    }

    // Commit transaction
    await connection.commit();
  } catch {
    if (connection) {
      try {
        await connection.rollback();
        //eslint-disable-next-line
      } catch (rollbackError) {
        // Silently handle rollback error
      }
    }
  } finally {
    if (connection) {
      connection.release();
    }

    // Continue to the next middleware
    next();
  }
};

// Refresh product cache after invalidation
export const refreshProductCache = async (req, res, next) => {
  // Only refresh cache for product-related routes
  if (req.originalUrl.includes("/api/products")) {
    try {
      // Get product service to refresh the cache
      const { productService } = req.app.locals;

      if (
        productService &&
        typeof productService.refreshProductCache === "function"
      ) {
        await productService.refreshProductCache();

        // Also refresh featured products if that method exists
        if (typeof productService.refreshFeaturedProductsCache === "function") {
          await productService.refreshFeaturedProductsCache();
        }
      }
    } catch {
      // Silently handle errors
    }
  }

  next();
};
