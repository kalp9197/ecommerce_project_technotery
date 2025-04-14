-- Create database
CREATE DATABASE IF NOT EXISTS my_db;
USE my_db;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_expired INT DEFAULT 0,
  last_login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  refresh_cycles INT DEFAULT 5,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active INT DEFAULT 1,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  p_cat_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active INT DEFAULT 1,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (p_cat_id) REFERENCES product_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  p_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  is_featured INT DEFAULT 0,
  is_active INT DEFAULT 1,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (p_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  total_items INT DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (cart_id) REFERENCES cart(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sample data with UUIDs
-- Insert admin user (password: admin123)
INSERT INTO users (id, uuid, name, email, password, is_active) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@example.com', '$2a$10$HIJKgf5eTENF1kqmjNHYjO.t7KwSfGa2NJJoH/NnmOoLn1z5AKP56', 1);

-- Insert product categories
INSERT INTO product_categories (id, uuid, name, is_active, created_by, updated_by) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440001', 'Electronics', 1, 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440002', 'Clothing', 1, 1, 1),
(3, '550e8400-e29b-41d4-a716-446655440003', 'Books', 1, 1, 1),
(4, '550e8400-e29b-41d4-a716-446655440004', 'Home & Kitchen', 1, 1, 1);

-- Insert products
INSERT INTO products (id, uuid, p_cat_id, name, description, price, is_active, created_by, updated_by) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440005', 1, 'Smartphone X', 'High-end smartphone with great camera', 999.99, 1, 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440006', 1, 'Laptop Pro', 'Professional grade laptop for developers', 1499.99, 1, 1, 1),
(3, '550e8400-e29b-41d4-a716-446655440007', 2, 'T-Shirt', 'Comfortable cotton t-shirt', 19.99, 1, 1, 1),
(4, '550e8400-e29b-41d4-a716-446655440008', 3, 'Programming 101', 'Learn the basics of programming', 29.99, 1, 1, 1),
(5, '550e8400-e29b-41d4-a716-446655440009', 4, 'Coffee Maker', 'Automatic coffee maker for your kitchen', 89.99, 1, 1, 1);

-- Insert product images
INSERT INTO product_images (id, uuid, p_id, image_path, is_featured, is_active, created_by, updated_by) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440010', 1, '/images/smartphone-front.jpg', 1, 1, 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440011', 1, '/images/smartphone-back.jpg', 0, 1, 1, 1),
(3, '550e8400-e29b-41d4-a716-446655440012', 2, '/images/laptop-open.jpg', 1, 1, 1, 1),
(4, '550e8400-e29b-41d4-a716-446655440013', 3, '/images/tshirt-front.jpg', 1, 1, 1, 1),
(5, '550e8400-e29b-41d4-a716-446655440014', 3, '/images/tshirt-back.jpg', 0, 1, 1, 1),
(6, '550e8400-e29b-41d4-a716-446655440015', 4, '/images/book-cover.jpg', 1, 1, 1, 1),
(7, '550e8400-e29b-41d4-a716-446655440016', 5, '/images/coffee-maker.jpg', 1, 1, 1, 1);
