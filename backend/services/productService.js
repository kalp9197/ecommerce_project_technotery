import { pool } from "../config/db.config.js";
import {
  redis,
  CACHE_KEYS,
  getVersionedKey,
  CACHE_TTL,
} from "../config/redis.config.js";

// Service for handling product-related operations
class ProductService {
  // Get all products from database, paginated
  async getAllProductsFromDb(limit = 8, offset = 0) {
    try {
      // Fetch complete product information including category
      const [products] = await pool.query(
        `SELECT p.*, c.name as category_name, c.uuid as category_uuid,
                p.is_featured, p.stock, p.sku, p.description
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // Fetch images for these products
      await this.attachProductImages(products);

      return products;
    } catch {
      return null;
    }
  }

  // Get featured products from database
  async getFeaturedProductsFromDb(limit = 4) {
    try {
      // Fetch featured products with complete information
      const [products] = await pool.query(
        `SELECT p.*, c.name as category_name, c.uuid as category_uuid,
                p.is_featured, p.stock, p.sku, p.description
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = true AND p.is_featured = true
         ORDER BY p.created_at DESC
         LIMIT ?`,
        [limit]
      );

      // Fetch images for these products
      await this.attachProductImages(products);

      return products;
    } catch {
      return null;
    }
  }

  // Helper method to attach product images
  async attachProductImages(products) {
    if (products && products.length > 0) {
      try {
        // Get all product IDs
        const productIds = products.map((p) => p.id);

        // Only run the query if we have product IDs
        if (productIds.length > 0) {
          // Try to fetch images
          const [imageResults] = await pool.query(
            `SELECT product_id, image_url 
             FROM product_images 
             WHERE product_id IN (?) 
             AND is_active = true`,
            [productIds]
          );

          // Group images by product_id
          const productImages = {};
          if (imageResults && imageResults.length > 0) {
            imageResults.forEach((img) => {
              if (!productImages[img.product_id]) {
                productImages[img.product_id] = [];
              }
              productImages[img.product_id].push(img.image_url);
            });

            // Add images to products
            products.forEach((product) => {
              product.images = productImages[product.id] || [];
            });
          } else {
            // If no images found, set empty arrays
            products.forEach((product) => {
              product.images = [];
            });
          }
        }
      } catch {
        // If there's an error with images, set empty arrays
        products.forEach((product) => {
          product.images = [];
        });
      }
    }
  }

  // Get products data, either from cache or database
  async getProducts(limit = 8, offset = 0) {
    try {
      // Get the versioned cache key
      const versionedKey = await getVersionedKey(CACHE_KEYS.PRODUCTS_PAGE_1);

      // Try to get from cache first
      const cachedData = await redis.get(versionedKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // If not in cache, get from database and cache it
      const productData = await this.getAllProductsFromDb(limit, offset);

      if (productData) {
        // Store in cache
        await redis.set(versionedKey, JSON.stringify(productData), {
          ex: CACHE_TTL,
        });
      }

      return productData;
    } catch {
      // On error, fallback to direct DB query
      return this.getAllProductsFromDb(limit, offset);
    }
  }

  // Get featured products, either from cache or database
  async getFeaturedProducts(limit = 4) {
    try {
      // Get the versioned cache key
      const versionedKey = await getVersionedKey(CACHE_KEYS.FEATURED_PRODUCTS);

      // Try to get from cache first
      const cachedData = await redis.get(versionedKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // If not in cache, get from database and cache it
      const productData = await this.getFeaturedProductsFromDb(limit);

      if (productData) {
        // Store in cache
        await redis.set(versionedKey, JSON.stringify(productData), {
          ex: CACHE_TTL,
        });
      }

      return productData;
    } catch {
      // On error, fallback to direct DB query
      return this.getFeaturedProductsFromDb(limit);
    }
  }

  // Refresh the product cache after invalidation
  async refreshProductCache() {
    try {
      // Get the versioned cache key
      const versionedKey = await getVersionedKey(CACHE_KEYS.PRODUCTS_PAGE_1);

      // Check if cache exists
      const cacheExists = await redis.exists(versionedKey);

      // If cache was invalidated, fetch fresh data and update
      if (!cacheExists) {
        // Get fresh product data (first page)
        const limit = 8;
        const offset = 0;

        const productData = await this.getAllProductsFromDb(limit, offset);
        if (productData) {
          // Store the fresh data in cache
          await redis.set(versionedKey, JSON.stringify(productData), {
            ex: CACHE_TTL,
          });
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  // Refresh the featured products cache
  async refreshFeaturedProductsCache() {
    try {
      // Get the versioned cache key
      const versionedKey = await getVersionedKey(CACHE_KEYS.FEATURED_PRODUCTS);

      // Check if cache exists
      const cacheExists = await redis.exists(versionedKey);

      // If cache was invalidated, fetch fresh data and update
      if (!cacheExists) {
        // Get fresh featured products data
        const limit = 4;

        const productData = await this.getFeaturedProductsFromDb(limit);
        if (productData) {
          // Store the fresh data in cache
          await redis.set(versionedKey, JSON.stringify(productData), {
            ex: CACHE_TTL,
          });
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }
}

export default ProductService;
