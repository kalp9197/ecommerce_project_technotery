-- Initialize database
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- Source all schema files
SOURCE db/users_schema.sql;
SOURCE db/product_schema.sql;
SOURCE db/cart_schema.sql;
SOURCE db/review_schema.sql;
SOURCE db/wishlist_schema.sql;
SOURCE db/user_analytics_schema.sql;

-- Source all seed data files
SOURCE db/users_seed.sql;
SOURCE db/product_seed.sql;
SOURCE db/cart_seed.sql;
SOURCE db/review_seed.sql;
SOURCE db/wishlist_seed.sql;
SOURCE db/user_analytics_seed.sql;
