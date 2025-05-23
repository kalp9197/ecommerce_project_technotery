-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  uuid                      VARCHAR(36) NOT NULL UNIQUE,
  name                      VARCHAR(100) NOT NULL,
  email                     VARCHAR(100) NOT NULL UNIQUE,
  password                  VARCHAR(255) NOT NULL,
  is_active                 BOOLEAN     NOT NULL DEFAULT TRUE,
  is_admin                  BOOLEAN     NOT NULL DEFAULT FALSE,
  email_verified            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Tokens Table
CREATE TABLE IF NOT EXISTS user_tokens (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  uuid                      VARCHAR(36) NOT NULL UNIQUE,
  user_id                   INT         NOT NULL,
  token                     TEXT        NULL,
  expires_at                TIMESTAMP   NOT NULL,
  is_expired                BOOLEAN     NOT NULL DEFAULT FALSE,
  last_login_date           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  refresh_cycles            INT         NOT NULL DEFAULT 5,
  verification_token        VARCHAR(255) NULL,
  verification_token_expires TIMESTAMP   NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
