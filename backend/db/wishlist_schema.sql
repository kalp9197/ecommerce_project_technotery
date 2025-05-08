-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  user_id     INT         NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wishlist Items Table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  wishlist_id INT         NOT NULL,
  product_id  INT         NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  added_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE CASCADE
);

-- Add unique constraint to prevent duplicate products in wishlist
ALTER TABLE wishlist_items
ADD CONSTRAINT unique_wishlist_product UNIQUE (wishlist_id, product_id);
