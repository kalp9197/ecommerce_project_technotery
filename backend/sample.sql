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
  is_active INT DEFAULT 1,
  is_admin INT DEFAULT 0
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

CREATE TABLE IF NOT EXISTS cart (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  total_items INT DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES cart(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert users (passwords are hashed for 'admin123' and 'user123')
INSERT INTO users (id, uuid, name, email, password, is_active, is_admin) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@example.com', '$2a$10$HIJKgf5eTENF1kqmjNHYjO.t7KwSfGa2NJJoH/NnmOoLn1z5AKP56', 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440100', 'Regular User', 'user@example.com', '$2a$10$HIJKgf5eTENF1kqmjNHYjO.t7KwSfGa2NJJoH/NnmOoLn1z5AKP56', 1, 0);

-- Insert user_tokens
INSERT INTO user_tokens (id, uuid, user_id, expires_at, is_expired, last_login_date, refresh_cycles) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440200', 1, '2025-05-21 12:00:00', 0, '2025-04-21 10:00:00', 5),
(2, '550e8400-e29b-41d4-a716-446655440201', 2, '2025-05-21 12:00:00', 0, '2025-04-21 10:00:00', 5);

-- Insert product categories
INSERT INTO product_categories (id, uuid, name, is_active, created_by, updated_by) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440001', 'Electronics', 1, 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440002', 'Clothing', 1, 1, 1),
(3, '550e8400-e29b-41d4-a716-446655440003', 'Books', 1, 1, 1),
(4, '550e8400-e29b-41d4-a716-446655440004', 'Home & Kitchen', 1, 1, 1);

-- Insert products
INSERT INTO products (id, uuid, p_cat_id, name, description, price, is_active, created_by, updated_by) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440005', 1, 'Smartphone X', 'High-end smartphone with great camera', 74999.00, 1, 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440006', 1, 'Laptop Pro', 'Professional grade laptop for developers', 112499.00, 1, 1, 1),
(3, '550e8400-e29b-41d4-a716-446655440007', 2, 'T-Shirt', 'Comfortable cotton t-shirt', 1499.00, 1, 1, 1),
(4, '550e8400-e29b-41d4-a716-446655440008', 3, 'Programming 101', 'Learn the basics of programming', 2249.00, 1, 1, 1),
(5, '550e8400-e29b-41d4-a716-446655440009', 4, 'Coffee Maker', 'Automatic coffee maker for your kitchen', 6749.00, 1, 1, 1),
(6, '550e8400-e29b-41d4-a716-446655440017', 1, 'Wireless Earbuds', 'True wireless earbuds with noise cancellation', 14999.00, 1, 1, 1),
(7, '550e8400-e29b-41d4-a716-446655440018', 1, 'Smart Watch', 'Fitness tracker with heart rate monitor', 22499.00, 1, 1, 1),
(8, '550e8400-e29b-41d4-a716-446655440019', 1, '4K Smart TV', '55-inch 4K Ultra HD Smart LED TV', 52499.00, 1, 1, 1),
(9, '550e8400-e29b-41d4-a716-446655440020', 1, 'Gaming Console', 'Next-gen gaming console with 1TB storage', 44999.00, 1, 1, 1),
(10, '550e8400-e29b-41d4-a716-446655440021', 1, 'Bluetooth Speaker', 'Portable speaker with deep bass', 7499.00, 1, 1, 1),
(11, '550e8400-e29b-41d4-a716-446655440022', 1, 'Tablet 10', '10-inch tablet with 64GB storage', 29999.00, 1, 1, 1),
(12, '550e8400-e29b-41d4-a716-446655440023', 1, 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 1999.00, 1, 1, 1),
(13, '550e8400-e29b-41d4-a716-446655440024', 1, 'Mechanical Keyboard', 'RGB mechanical keyboard for gaming', 8999.00, 1, 1, 1),
(14, '550e8400-e29b-41d4-a716-446655440025', 1, 'External SSD 1TB', 'Portable 1TB solid-state drive', 12499.00, 1, 1, 1),
(15, '550e8400-e29b-41d4-a716-446655440026', 1, 'Smart Home Hub', 'Control all smart devices from one hub', 9999.00, 1, 1, 1),
(16, '550e8400-e29b-41d4-a716-446655440027', 1, 'Action Camera', '4K action camera with waterproof case', 17499.00, 1, 1, 1),
(17, '550e8400-e29b-41d4-a716-446655440028', 1, 'Wireless Charger', 'Fast wireless charging pad', 2999.00, 1, 1, 1),
(18, '550e8400-e29b-41d4-a716-446655440029', 1, 'VR Headset', 'Virtual reality headset for immersive gaming', 34999.00, 1, 1, 1),
(19, '550e8400-e29b-41d4-a716-446655440030', 1, 'Smart Doorbell', 'Video doorbell with motion detection', 14999.00, 1, 1, 1),
(20, '550e8400-e29b-41d4-a716-446655440031', 1, 'Mini Projector', 'Portable projector for home theater', 22499.00, 1, 1, 1),
(21, '550e8400-e29b-41d4-a716-446655440032', 1, 'Fitness Band', 'Lightweight fitness tracker with sleep monitoring', 4999.00, 1, 1, 1),
(22, '550e8400-e29b-41d4-a716-446655440033', 1, 'Smart Light Bulb', 'Wi-Fi-enabled color-changing LED bulb', 2499.00, 1, 1, 1),
(23, '550e8400-e29b-41d4-a716-446655440034', 1, 'Portable Power Bank', '20000mAh power bank with fast charging', 3999.00, 1, 1, 1),
(24, '550e8400-e29b-41d4-a716-446655440035', 1, 'Noise-Cancelling Headphones', 'Over-ear headphones with ANC', 24999.00, 1, 1, 1),
(25, '550e8400-e29b-41d4-a716-446655440036', 1, 'Smart Thermostat', 'Energy-saving smart thermostat', 12999.00, 1, 1, 1),
(26, '550e8400-e29b-41d4-a716-446655440037', 1, 'Gaming Monitor', '27-inch 144Hz gaming monitor', 34999.00, 1, 1, 1),
(27, '550e8400-e29b-41d4-a716-446655440038', 1, 'Webcam HD', '1080p webcam for video conferencing', 6499.00, 1, 1, 1),
(28, '550e8400-e29b-41d4-a716-446655440039', 1, 'Smart Speaker', 'Voice-activated speaker with assistant', 9999.00, 1, 1, 1),
(29, '550e8400-e29b-41d4-a716-446655440040', 1, 'Wireless Router', 'Dual-band Wi-Fi 6 router', 7999.00, 1, 1, 1),
(30, '550e8400-e29b-41d4-a716-446655440041', 1, 'Dash Cam', '4K dash camera with night vision', 11999.00, 1, 1, 1),
(31, '550e8400-e29b-41d4-a716-446655440042', 2, 'Denim Jacket', 'Classic blue denim jacket', 3999.00, 1, 1, 1),
(32, '550e8400-e29b-41d4-a716-446655440043', 2, 'Cargo Pants', 'Comfortable cargo pants with multiple pockets', 2999.00, 1, 1, 1),
(33, '550e8400-e29b-41d4-a716-446655440044', 2, 'Hoodie', 'Soft cotton hoodie with kangaroo pocket', 2499.00, 1, 1, 1),
(34, '550e8400-e29b-41d4-a716-446655440045', 2, 'Formal Shirt', 'Slim-fit white dress shirt', 1999.00, 1, 1, 1),
(35, '550e8400-e29b-41d4-a716-446655440046', 2, 'Chinos', 'Versatile slim-fit chinos', 2499.00, 1, 1, 1),
(36, '550e8400-e29b-41d4-a716-446655440047', 2, 'Sneakers', 'Casual white sneakers', 3499.00, 1, 1, 1),
(37, '550e8400-e29b-41d4-a716-446655440048', 2, 'Sweatshirt', 'Crewneck sweatshirt for everyday wear', 1999.00, 1, 1, 1),
(38, '550e8400-e29b-41d4-a716-446655440049', 2, 'Leather Belt', 'Genuine leather belt with metal buckle', 1499.00, 1, 1, 1),
(39, '550e8400-e29b-41d4-a716-446655440050', 2, 'Winter Jacket', 'Insulated jacket for cold weather', 5999.00, 1, 1, 1),
(40, '550e8400-e29b-41d4-a716-446655440051', 2, 'Polo Shirt', 'Classic polo shirt with logo', 1799.00, 1, 1, 1),
(41, '550e8400-e29b-41d4-a716-446655440052', 2, 'Running Shoes', 'Breathable running shoes with cushioning', 4999.00, 1, 1, 1),
(42, '550e8400-e29b-41d4-a716-446655440053', 2, 'Track Pants', 'Comfortable track pants for workouts', 1999.00, 1, 1, 1),
(43, '550e8400-e29b-41d4-a716-446655440054', 2, 'Beanie', 'Warm knit beanie for winter', 999.00, 1, 1, 1),
(44, '550e8400-e29b-41d4-a716-446655440055', 2, 'Sunglasses', 'Polarized sunglasses with UV protection', 2499.00, 1, 1, 1),
(45, '550e8400-e29b-41d4-a716-446655440056', 2, 'Casual Shorts', 'Cotton shorts for summer', 1499.00, 1, 1, 1),
(46, '550e8400-e29b-41d4-a716-446655440057', 2, 'Backpack', 'Durable backpack for daily use', 2999.00, 1, 1, 1),
(47, '550e8400-e29b-41d4-a716-446655440058', 2, 'Wool Scarf', 'Soft wool scarf for winter', 1299.00, 1, 1, 1),
(48, '550e8400-e29b-41d4-a716-446655440059', 2, 'Baseball Cap', 'Adjustable cotton baseball cap', 999.00, 1, 1, 1),
(49, '550e8400-e29b-41d4-a716-446655440060', 2, 'Raincoat', 'Waterproof raincoat with hood', 3499.00, 1, 1, 1),
(50, '550e8400-e29b-41d4-a716-446655440061', 2, 'Gym Tank Top', 'Breathable tank top for workouts', 1299.00, 1, 1, 1),
(51, '550e8400-e29b-41d4-a716-446655440062', 2, 'Socks Pack', 'Pack of 5 cotton socks', 799.00, 1, 1, 1),
(52, '550e8400-e29b-41d4-a716-446655440063', 2, 'Leather Wallet', 'Slim leather wallet with RFID protection', 1999.00, 1, 1, 1),
(53, '550e8400-e29b-41d4-a716-446655440064', 2, 'Windbreaker', 'Lightweight windbreaker jacket', 2999.00, 1, 1, 1),
(54, '550e8400-e29b-41d4-a716-446655440065', 2, 'Formal Trousers', 'Tailored trousers for office wear', 2499.00, 1, 1, 1),
(55, '550e8400-e29b-41d4-a716-446655440066', 2, 'Sports Bra', 'High-support sports bra for active women', 1999.00, 1, 1, 1),
(56, '550e8400-e29b-41d4-a716-446655440067', 3, 'Python Mastery', 'Comprehensive guide to Python programming', 2999.00, 1, 1, 1),
(57, '550e8400-e29b-41d4-a716-446655440068', 3, 'Data Science Basics', 'Introduction to data science and analytics', 3499.00, 1, 1, 1),
(58, '550e8400-e29b-41d4-a716-446655440069', 3, 'AI Revolution', 'Exploring the future of artificial intelligence', 2499.00, 1, 1, 1),
(59, '550e8400-e29b-41d4-a716-446655440070', 3, 'Web Development', 'Learn full-stack web development', 3999.00, 1, 1, 1),
(60, '550e8400-e29b-41d4-a716-446655440071', 3, 'Cybersecurity 101', 'Protecting systems from cyber threats', 2999.00, 1, 1, 1),
(61, '550e8400-e29b-41d4-a716-446655440072', 3, 'Cloud Computing', 'Guide to AWS, Azure, and Google Cloud', 3499.00, 1, 1, 1),
(62, '550e8400-e29b-41d4-a716-446655440073', 3, 'Machine Learning', 'Practical machine learning with Python', 3999.00, 1, 1, 1),
(63, '550e8400-e29b-41d4-a716-446655440074', 3, 'Blockchain Basics', 'Understanding blockchain technology', 2499.00, 1, 1, 1),
(64, '550e8400-e29b-41d4-a716-446655440075', 3, 'DevOps Handbook', 'Implementing DevOps in your organization', 2999.00, 1, 1, 1),
(65, '550e8400-e29b-41d4-a716-446655440076', 3, 'JavaScript Guide', 'Mastering JavaScript for web development', 3499.00, 1, 1, 1),
(66, '550e8400-e29b-41d4-a716-446655440077', 3, 'SQL Essentials', 'Learn database management with SQL', 1999.00, 1, 1, 1),
(67, '550e8400-e29b-41d4-a716-446655440078', 3, 'Ethical Hacking', 'Introduction to ethical hacking techniques', 3999.00, 1, 1, 1),
(68, '550e8400-e29b-41d4-a716-446655440079', 3, 'Linux for Beginners', 'Getting started with Linux systems', 2499.00, 1, 1, 1),
(69, '550e8400-e29b-41d4-a716-446655440080', 3, 'UX Design', 'Designing user-friendly interfaces', 2999.00, 1, 1, 1),
(70, '550e8400-e29b-41d4-a716-446655440081', 3, 'Game Development', 'Building games with Unity', 3499.00, 1, 1, 1),
(71, '550e8400-e29b-41d4-a716-446655440082', 3, 'Big Data Analytics', 'Harnessing the power of big data', 3999.00, 1, 1, 1),
(72, '550e8400-e29b-41d4-a716-446655440083', 3, 'Networking Basics', 'Fundamentals of computer networking', 2499.00, 1, 1, 1),
(73, '550e8400-e29b-41d4-a716-446655440084', 3, 'IoT Fundamentals', 'Introduction to Internet of Things', 2999.00, 1, 1, 1),
(74, '550e8400-e29b-41d4-a716-446655440085', 3, 'Robotics 101', 'Building and programming robots', 3499.00, 1, 1, 1),
(75, '550e8400-e29b-41d4-a716-446655440086', 3, 'API Development', 'Creating RESTful APIs', 2999.00, 1, 1, 1),
(76, '550e8400-e29b-41d4-a716-446655440087', 3, 'Mobile App Dev', 'Building apps for iOS and Android', 3999.00, 1, 1, 1),
(77, '550e8400-e29b-41d4-a716-446655440088', 3, 'Quantum Computing', 'Introduction to quantum computing', 4499.00, 1, 1, 1),
(78, '550e8400-e29b-41d4-a716-446655440089', 3, 'AR/VR Development', 'Creating augmented and virtual reality apps', 3999.00, 1, 1, 1),
(79, '550e8400-e29b-41d4-a716-446655440090', 3, 'Software Testing', 'Manual and automated testing techniques', 2499.00, 1, 1, 1),
(80, '550e8400-e29b-41d4-a716-446655440091', 3, 'Agile Methodology', 'Implementing agile in software projects', 1999.00, 1, 1, 1),
(81, '550e8400-e29b-41d4-a716-446655440092', 4, 'Air Fryer', '5-quart air fryer for healthy cooking', 7999.00, 1, 1, 1),
(82, '550e8400-e29b-41d4-a716-446655440093', 4, 'Blender', 'High-power blender for smoothies', 4999.00, 1, 1, 1),
(83, '550e8400-e29b-41d4-a716-446655440094', 4, 'Microwave Oven', '25L microwave with grill function', 9999.00, 1, 1, 1),
(84, '550e8400-e29b-41d4-a716-446655440095', 4, 'Electric Kettle', '1.7L stainless steel kettle', 2499.00, 1, 1, 1),
(85, '550e8400-e29b-41d4-a716-446655440096', 4, 'Toaster', '4-slice toaster with browning control', 3499.00, 1, 1, 1),
(86, '550e8400-e29b-41d4-a716-446655440097', 4, 'Food Processor', 'Multi-function food processor', 6499.00, 1, 1, 1),
(87, '550e8400-e29b-41d4-a716-446655440098', 4, 'Vacuum Cleaner', 'Cordless vacuum cleaner with HEPA filter', 14999.00, 1, 1, 1),
(88, '550e8400-e29b-41d4-a716-446655440099', 4, 'Pressure Cooker', '6-quart electric pressure cooker', 6999.00, 1, 1, 1),
(89, '550e8400-e29b-41d4-a716-446655440100', 4, 'Rice Cooker', '5-cup rice cooker with steamer', 3999.00, 1, 1, 1),
(90, '550e8400-e29b-41d4-a716-446655440101', 4, 'Juicer', 'Cold press juicer for fruits and vegetables', 7999.00, 1, 1, 1),
(91, '550e8400-e29b-41d4-a716-446655440102', 4, 'Ceiling Fan', '52-inch ceiling fan with remote', 4999.00, 1, 1, 1),
(92, '550e8400-e29b-41d4-a716-446655440103', 4, 'Air Purifier', 'HEPA air purifier for large rooms', 9999.00, 1, 1, 1),
(93, '550e8400-e29b-41d4-a716-446655440104', 4, 'Slow Cooker', '7-quart slow cooker for family meals', 5499.00, 1, 1, 1),
(94, '550e8400-e29b-41d4-a716-446655440105', 4, 'Hand Mixer', '5-speed hand mixer for baking', 2999.00, 1, 1, 1),
(95, '550e8400-e29b-41d4-a716-446655440106', 4, 'Dinnerware Set', '16-piece ceramic dinnerware set', 4999.00, 1, 1, 1),
(96, '550e8400-e29b-41d4-a716-446655440107', 4, 'Cutlery Set', '24-piece stainless steel cutlery set', 2499.00, 1, 1, 1),
(97, '550e8400-e29b-41d4-a716-446655440108', 4, 'Non-Stick Cookware', '10-piece non-stick cookware set', 7999.00, 1, 1, 1),
(98, '550e8400-e29b-41d4-a716-446655440109', 4, 'Water Purifier', 'RO+UV water purifier for home', 11999.00, 1, 1, 1),
(99, '550e8400-e29b-41d4-a716-446655440110', 4, 'Table Lamp', 'Adjustable LED table lamp', 1999.00, 1, 1, 1),
(100, '550e8400-e29b-41d4-a716-446655440111', 4, 'Storage Organizer', '5-tier storage organizer for kitchen', 3499.00, 1, 1, 1),
(101, '550e8400-e29b-41d4-a716-446655440112', 4, 'Electric Griddle', 'Large electric griddle for breakfast', 3999.00, 1, 1, 1),
(102, '550e8400-e29b-41d4-a716-446655440113', 4, 'Humidifier', 'Ultrasonic cool mist humidifier', 4999.00, 1, 1, 1),
(103, '550e8400-e29b-41d4-a716-446655440114', 4, 'Knife Set', '6-piece stainless steel knife set', 2499.00, 1, 1, 1),
(104, '550e8400-e29b-41d4-a716-446655440115', 4, 'Electric Iron', 'Steam iron with non-stick soleplate', 1999.00, 1, 1, 1),
(105, '550e8400-e29b-41d4-a716-446655440116', 4, 'Glassware Set', '12-piece glassware set for beverages', 1999.00, 1, 1, 1);

-- Insert product images (original + additional random samples)
INSERT INTO product_images (id, uuid, p_id, image_path, is_featured, is_active, created_by, updated_by) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440010', 1, '/images/smartphone-front.jpg', 1, 1, 1, 1),
(2, '550e8400-e29b-41d4-a716-446655440011', 1, '/images/smartphone-back.jpg', 0, 1, 1, 1),
(3, '550e8400-e29b-41d4-a716-446655440012', 2, '/images/laptop-open.jpg', 1, 1, 1, 1),
(4, '550e8400-e29b-41d4-a716-446655440013', 3, '/images/tshirt-front.jpg', 1, 1, 1, 1),
(5, '550e8400-e29b-41d4-a716-446655440014', 3, '/images/tshirt-back.jpg', 0, 1, 1, 1),
(6, '550e8400-e29b-41d4-a716-446655440015', 4, '/images/book-cover.jpg', 1, 1, 1, 1),
(7, '550e8400-e29b-41d4-a716-446655440016', 5, '/images/coffee-maker.jpg', 1, 1, 1, 1),
(8, '550e8400-e29b-41d4-a716-446655440117', 6, '/images/earbuds.jpg', 1, 1, 1, 1),
(9, '550e8400-e29b-41d4-a716-446655440118', 7, '/images/smartwatch.jpg', 1, 1, 1, 1),
(10, '550e8400-e29b-41d4-a716-446655440119', 8, '/images/tv-front.jpg', 1, 1, 1, 1),
(11, '550e8400-e29b-41d4-a716-446655440120', 9, '/images/console.jpg', 1, 1, 1, 1),
(12, '550e8400-e29b-41d4-a716-446655440121', 10, '/images/speaker.jpg', 1, 1, 1, 1),
(13, '550e8400-e29b-41d4-a716-446655440122', 11, '/images/tablet-front.jpg', 1, 1, 1, 1),
(14, '550e8400-e29b-41d4-a716-446655440123', 12, '/images/mouse.jpg', 1, 1, 1, 1),
(15, '550e8400-e29b-41d4-a716-446655440124', 31, '/images/denim-jacket.jpg', 1, 1, 1, 1),
(16, '550e8400-e29b-41d4-a716-446655440125', 32, '/images/cargo-pants.jpg', 1, 1, 1, 1),
(17, '550e8400-e29b-41d4-a716-446655440126', 56, '/images/python-book.jpg', 1, 1, 1, 1),
(18, '550e8400-e29b-41d4-a716-446655440127', 81, '/images/air-fryer.jpg', 1, 1, 1, 1),
(19, '550e8400-e29b-41d4-a716-446655440128', 82, '/images/blender.jpg', 1, 1, 1, 1),
(20, '550e8400-e29b-41d4-a716-446655440129', 83, '/images/microwave.jpg', 1, 1, 1, 1);

-- Insert carts
INSERT INTO cart (id, uuid, user_id, is_active, total_items, total_price) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440300', 1, 1, 3, 78997.00),
(2, '550e8400-e29b-41d4-a716-446655440301', 2, 1, 2, 3498.00);

-- Insert cart_items
INSERT INTO cart_items (id, uuid, cart_id, product_id, quantity, price, is_active) VALUES 
(1, '550e8400-e29b-41d4-a716-446655440400', 1, 1, 1, 74999.00, 1), -- Smartphone X
(2, '550e8400-e29b-41d4-a716-446655440401', 1, 3, 2, 1499.00, 1),  -- T-Shirt
(3, '550e8400-e29b-41d4-a716-446655440402', 1, 4, 1, 2249.00, 1),  -- Programming 101
(4, '550e8400-e29b-41d4-a716-446655440403', 2, 3, 1, 1499.00, 1),  -- T-Shirt
(5, '550e8400-e29b-41d4-a716-446655440404', 2, 43, 2, 999.00, 1);   -- Beanie