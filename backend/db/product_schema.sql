-- Product Categories Table
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

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  p_cat_id    INT         NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity    INT           NOT NULL DEFAULT 0,
  is_featured BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by  INT,
  updated_by  INT,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (p_cat_id)   REFERENCES product_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)              ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id)              ON DELETE SET NULL
);

-- Product Images Table
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
