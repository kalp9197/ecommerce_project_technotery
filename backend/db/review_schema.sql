-- Product Reviews and Ratings Table
CREATE TABLE IF NOT EXISTS product_reviews (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  uuid         VARCHAR(36) NOT NULL UNIQUE,
  product_id   INT         NOT NULL,
  user_id      INT         NOT NULL,
  rating       FLOAT       NOT NULL,
  review       TEXT,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);
