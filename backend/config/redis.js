import { Redis } from "@upstash/redis";
import { REDIS_CONFIG } from "../constants/env.js";

// Initialize Redis client with Upstash
export const redis = new Redis({
  url: REDIS_CONFIG.URL,
  token: REDIS_CONFIG.TOKEN,
});

// Reduce Cache TTL to handle direct database changes better (5 minutes default)
export const CACHE_TTL = REDIS_CONFIG.TTL || 300;

// Cache version control - used to invalidate all caches
const CACHE_VERSION_KEY = "cache:version";

// Initialize or get cache version
export const getCacheVersion = async () => {
  try {
    let version = await redis.get(CACHE_VERSION_KEY);
    if (!version) {
      version = Date.now().toString();
      await redis.set(CACHE_VERSION_KEY, version);
    }
    return version;
  } catch (error) {
    // Return timestamp as fallback if Redis is unreachable
    return Date.now().toString();
  }
};

// Bump cache version to invalidate all caches
export const invalidateAllCaches = async () => {
  try {
    const newVersion = Date.now().toString();
    await redis.set(CACHE_VERSION_KEY, newVersion);
    return newVersion;
  } catch (error) {
    return null;
  }
};

// Cache keys with version prefix
export const CACHE_KEYS = {
  PRODUCTS_PAGE_1: "products:page:1:limit:8",
  PRODUCT_DETAILS: (uuid) => `product:${uuid}`,
  CATEGORIES: "categories:all",
  FEATURED_PRODUCTS: "products:featured",
};

// Helper to get versioned cache key
export const getVersionedKey = async (key) => {
  const version = await getCacheVersion();
  return `v${version}:${key}`;
};
