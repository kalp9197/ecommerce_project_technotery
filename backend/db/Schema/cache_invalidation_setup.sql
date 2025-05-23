USE `ecommerce_db`;

-- Create cache_invalidation_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS `cache_invalidation_events` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `event_type` VARCHAR(50) NOT NULL,
  `event_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed` BOOLEAN DEFAULT FALSE,
  INDEX `idx_processed` (`processed`) 
);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS `products_after_update`;
DROP TRIGGER IF EXISTS `products_after_insert`;
DROP TRIGGER IF EXISTS `products_after_delete`;

-- Create trigger for product updates
DELIMITER //
CREATE TRIGGER `products_after_update` 
AFTER UPDATE ON `products` 
FOR EACH ROW 
BEGIN
  INSERT INTO `cache_invalidation_events` (`event_type`, `event_time`, `processed`) 
  VALUES ('product_update', NOW(), FALSE);
END//

-- Create trigger for product inserts
CREATE TRIGGER `products_after_insert` 
AFTER INSERT ON `products` 
FOR EACH ROW 
BEGIN
  INSERT INTO `cache_invalidation_events` (`event_type`, `event_time`, `processed`) 
  VALUES ('product_update', NOW(), FALSE);
END//

-- Create trigger for product deletes
CREATE TRIGGER `products_after_delete` 
AFTER DELETE ON `products` 
FOR EACH ROW 
BEGIN
  INSERT INTO `cache_invalidation_events` (`event_type`, `event_time`, `processed`) 
  VALUES ('product_update', NOW(), FALSE);
END//
DELIMITER ;

-- Create stored procedure to clean up old processed events
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `cleanup_cache_events`()
BEGIN
  -- Delete processed events older than 7 days
  DELETE FROM `cache_invalidation_events` 
  WHERE `processed` = TRUE 
  AND `event_time` < DATE_SUB(NOW(), INTERVAL 7 DAY);
END//
DELIMITER ;

-- Create event scheduler to run cleanup daily
DROP EVENT IF EXISTS `daily_cache_cleanup`;
DELIMITER //
CREATE EVENT `daily_cache_cleanup`
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
  CALL cleanup_cache_events();
END//
DELIMITER ; 