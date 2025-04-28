-- Drop and recreate the database
DROP DATABASE IF EXISTS my_db;
CREATE DATABASE my_db;
USE my_db;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  uuid         VARCHAR(36) NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  is_admin     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uuid            VARCHAR(36) NOT NULL UNIQUE,
  user_id         INT         NOT NULL,
  expires_at      TIMESTAMP   NOT NULL,
  is_expired      BOOLEAN     NOT NULL DEFAULT FALSE,
  last_login_date TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  refresh_cycles  INT         NOT NULL DEFAULT 5,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by  INT,
  updated_by  INT,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  p_cat_id    INT         NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity    INT           NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by  INT,
  updated_by  INT,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (p_cat_id)   REFERENCES product_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)              ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id)              ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  p_id        INT         NOT NULL,
  image_path  VARCHAR(255) NOT NULL,
  is_featured BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by  INT,
  updated_by  INT,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (p_id)        REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (updated_by)  REFERENCES users(id)    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  user_id     INT         NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  total_items INT         NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  uuid       VARCHAR(36) NOT NULL UNIQUE,
  cart_id    INT         NOT NULL,
  product_id INT         NOT NULL,
  quantity   INT         NOT NULL DEFAULT 1,
  price      DECIMAL(10,2) NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE, 
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id)    REFERENCES cart(id)     ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Seed data with raw, valid UUIDv4 values

INSERT INTO users (uuid, name, email, password, is_active, is_admin) VALUES
  ('33cd07d3-96e1-45b5-9f59-11c8a07b25b7', 'Admin User',   'admin@example.com',  '$2a$10$HIJKgf5eTENF1kqmjNHYjO.t7KwSfGa2NJJoH/NnmOoLn1z5AKP56', TRUE, TRUE),
  ('5de5afcf-8414-4dcc-8542-fcaf3fb672cd', 'Regular User', 'user@example.com',   '$2a$10$HIJKgf5eTENF1kqmjNHYjO.t7KwSfGa2NJJoH/NnmOoLn1z5AKP56', TRUE, FALSE);

INSERT INTO user_tokens (uuid, user_id, expires_at, is_expired, last_login_date, refresh_cycles) VALUES
  ('ae3857e5-859f-4e5a-96ce-062997e6453a', 1, '2025-05-21 12:00:00', FALSE, CURRENT_TIMESTAMP, 5),
  ('a072add4-b079-4082-95bb-a4e1bfd41f37', 2, '2025-05-21 12:00:00', FALSE, CURRENT_TIMESTAMP, 5);

INSERT INTO product_categories (uuid, name, is_active, created_by, updated_by) VALUES
  ('dcc82d4f-de01-4ede-ac4b-1188272818d8', 'Electronics', TRUE, 1, 1),
  ('e93ec581-4b2b-47d3-b385-5a9e183c92a4', 'Clothing',    TRUE, 1, 1),
  ('0828394b-623f-47fd-8bf9-8f3f58f5ca03', 'Books',       TRUE, 1, 1),
  ('c8384fc3-5772-4bed-b735-6d6130298db5', 'Home & Kitchen', TRUE, 1, 1);

INSERT INTO products (uuid, p_cat_id, name, description, price, quantity, is_active, created_by, updated_by) VALUES
  ('86397211-99c3-408f-ac0a-9db43775e78f', 1, 'Smartphone X',   'High-end smartphone with great camera',               74999.00, 25, TRUE, 1, 1),
  ('96d13c07-106e-49c6-9ff6-9bd3aa0c0d12', 1, 'Laptop Pro',     'Professional grade laptop for developers',           112499.00, 15, TRUE, 1, 1),
  ('df4ab613-2f21-46df-a41e-309d5548cace', 1, 'Wireless Earbuds','True wireless earbuds with noise cancellation',   14999.00, 45, TRUE, 1, 1),
  ('01c5673e-8c48-482c-8a33-6b3030626486', 2, 'T-Shirt',        'Comfortable cotton t‑shirt',                        1499.00, 100, TRUE, 1, 1),
  ('12822405-2625-40c1-a0c5-27b467017ec8', 2, 'Denim Jacket',   'Classic blue denim jacket',                        3999.00,  30, TRUE, 1, 1),
  ('970396db-8398-4a69-8703-b52b36aaee18', 2, 'Beanie',         'Warm knit beanie for winter',                       999.00,  50, TRUE, 1, 1),
  ('523d2171-0a98-4ddd-bda1-db31ecdda11b', 3, 'Programming 101','Learn the basics of programming',                  2249.00,  50, TRUE, 1, 1),
  ('80e5fb6f-8167-4fec-9cc9-97cf337d9456', 3, 'Python Mastery', 'Comprehensive guide to Python programming',         2999.00,  40, TRUE, 1, 1),
  ('ab3f992a-ab2f-4c7a-a002-e2751b428542', 4, 'Coffee Maker',   'Automatic coffee maker for your kitchen',           6749.00,  30, TRUE, 1, 1),
  ('0bfc5892-e4f2-4c19-997d-1778fe2d3e17', 4, 'Air Fryer',      '5‑quart air fryer for healthy cooking',             7999.00,  20, TRUE, 1, 1);

INSERT INTO product_images (uuid, p_id, image_path, is_featured, is_active, created_by, updated_by) VALUES
  ('506a4f16-9ea6-4338-89f3-722699f34961', 1, '/images/smartphone-front.jpg',  TRUE,  TRUE, 1, 1),
  ('29d832a6-eaac-4ca2-b24c-b8f399a96d35', 1, '/images/smartphone-back.jpg',   FALSE, TRUE, 1, 1),
  ('c0243072-e535-484a-aa90-f9715156935c', 2, '/images/laptop-open.jpg',       TRUE,  TRUE, 1, 1),
  ('ac25ddba-cb3b-4900-a7ef-120e8c64c8cf', 2, '/images/laptop-side.jpg',       FALSE, TRUE, 1, 1),
  ('207afc97-520d-4b14-8967-583330120b69', 3, '/images/earbuds.jpg',           TRUE,  TRUE, 1, 1),
  ('e40e2028-ab34-486b-80a1-f8b60be91e6d', 3, '/images/earbuds-case.jpg',      FALSE, TRUE, 1, 1),
  ('b5525946-1e7e-4d50-83bc-499928021085', 4, '/images/tshirt-front.jpg',      TRUE,  TRUE, 1, 1),
  ('f8c6afc5-1e93-467f-96be-4bc9c26c2def', 4, '/images/tshirt-back.jpg',       FALSE, TRUE, 1, 1),
  ('35e3bc37-7863-4a26-bbd8-059e0ded9c77', 5, '/images/denim-jacket.jpg',      TRUE,  TRUE, 1, 1),
  ('1b86c8a7-9e6a-4b50-b8a4-46cd0abc627e', 6, '/images/beanie.jpg',            TRUE,  TRUE, 1, 1),
  ('454d6008-8488-45ee-b5c3-8a77f7c51de2', 7, '/images/book-cover.jpg',        TRUE,  TRUE, 1, 1),
  ('ebb95a61-11ce-48fe-af4a-c74f588d7e9e', 8, '/images/python-book.jpg',       TRUE,  TRUE, 1, 1),
  ('fdd79081-8113-47e0-a153-006931b0815f', 9, '/images/coffee-maker.jpg',      TRUE,  TRUE, 1, 1),
  ('ab93bb44-9780-4474-9da8-aec250450298', 9, '/images/coffee-maker-side.jpg', FALSE, TRUE, 1, 1),
  ('e5a9fb03-d693-4885-bf34-c557c089878c',10, '/images/air-fryer.jpg',         TRUE,  TRUE, 1, 1);

INSERT INTO cart (uuid, user_id, is_active, total_items, total_price) VALUES
  ('b175be98-bf9d-4fa5-ba95-eb9f2ab6d7ff', 1, TRUE, 3, 79247.00),
  ('daf87601-f8d2-418a-b3ca-5644cd34f823', 2, TRUE, 3, 3497.00);

INSERT INTO cart_items (uuid, cart_id, product_id, quantity, price, is_active) VALUES
  ('42f52623-0b85-49c7-95fe-769e726461b0', 1, 1, 1, 74999.00, TRUE),
  ('63e103e9-ad1c-4730-93e5-ba8549a8578a', 1, 4, 2, 1499.00,  TRUE),
  ('b5e857f0-92ea-4e96-9b90-55397161c4a6', 1, 7, 1, 2249.00,  TRUE),
  ('6f3f5476-e5fa-47af-8181-a7250a5616e9', 2, 4, 1, 1499.00,  TRUE),
  ('88bcb61a-1f08-4af6-acfa-6abbeefd39c0', 2, 6, 2,  999.00,  TRUE);