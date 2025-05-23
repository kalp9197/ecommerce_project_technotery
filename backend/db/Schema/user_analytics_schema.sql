-- User Analytics Table
CREATE TABLE IF NOT EXISTS user_analytics (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uuid              VARCHAR(36) NOT NULL UNIQUE,
  user_id           INT         NOT NULL,
  event_type        ENUM('add_to_cart', 'remove_from_cart', 'add_to_wishlist', 'remove_from_wishlist') NOT NULL,
  product_id        INT,
  quantity          INT,
  metadata          JSON,
  created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);


