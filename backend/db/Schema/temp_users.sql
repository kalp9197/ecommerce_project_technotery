CREATE TABLE temp_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE, 
  name VARCHAR(100) NOT NULL,        
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,    
  verification_token VARCHAR(255) NOT NULL, 
  is_verified BOOLEAN DEFAULT FALSE, 
  expires_at TIMESTAMP NOT NULL,     
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
); 