-- Initialize database
-- DROP DATABASE IF EXISTS ecommerce_db;
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- Source all schema files
SOURCE db/Schema/user_schema.sql;
SOURCE db/Schema/product_schema.sql;
SOURCE db/Schema/cart_schema.sql;
SOURCE db/Schema/review_schema.sql;
SOURCE db/Schema/wishlist_schema.sql;
SOURCE db/Schema/user_analytics_schema.sql;
SOURCE db/Schema/cache_invalidation_setup.sql;
SOURCE db/Schema/user_tokens_schema.sql;

-- Source all seed data files
SOURCE db/Seed/users_seed.sql;
SOURCE db/Seed/product_seed.sql;
SOURCE db/Seed/cart_seed.sql;
SOURCE db/Seed/review_seed.sql;
SOURCE db/Seed/wishlist_seed.sql;
SOURCE db/Seed/user_analytics_seed.sql;
