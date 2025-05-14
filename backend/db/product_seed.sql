-- Insert product categories
INSERT INTO product_categories (uuid, name, is_active, created_by)
VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Electronics', TRUE, 1),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Clothing', TRUE, 1),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Books', TRUE, 1),
('49eebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 'Home & Kitchen', TRUE, 1),
('50eebc99-9c0b-4ef8-bb6d-6bb9bd380ccc', 'Sports & Outdoors', TRUE, 1),
('61eebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', 'Beauty & Personal Care', TRUE, 1);

-- Insert products
INSERT INTO products (uuid, p_cat_id, name, description, price, quantity, is_featured, is_active, created_by)
VALUES
-- Electronics
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 1, 'Smartphone', 'Latest smartphone with amazing features', 699.99, 50, TRUE, TRUE, 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 1, 'Laptop', 'Powerful laptop for work and gaming', 1299.99, 30, FALSE, TRUE, 1),
('72eebc99-9c0b-4ef8-bb6d-6bb9bd380eee', 1, 'Wireless Earbuds', 'Premium sound quality with noise cancellation', 129.99, 75, TRUE, TRUE, 1),
('83eebc99-9c0b-4ef8-bb6d-6bb9bd380fff', 1, 'Smart Watch', 'Track your fitness and stay connected', 249.99, 40, FALSE, TRUE, 1),
('94eebc99-9c0b-4ef8-bb6d-6bb9bd381000', 1, 'Tablet', '10-inch display with high resolution', 399.99, 25, FALSE, TRUE, 1),

-- Clothing
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 2, 'T-Shirt', 'Comfortable cotton t-shirt', 19.99, 100, FALSE, TRUE, 1),
('a5eebc99-9c0b-4ef8-bb6d-6bb9bd381111', 2, 'Jeans', 'Classic denim jeans for everyday wear', 49.99, 80, TRUE, TRUE, 1),
('b6eebc99-9c0b-4ef8-bb6d-6bb9bd381222', 2, 'Hoodie', 'Warm and cozy hoodie for winter', 39.99, 60, FALSE, TRUE, 1),
('c7eebc99-9c0b-4ef8-bb6d-6bb9bd381333', 2, 'Dress Shirt', 'Formal shirt for professional settings', 59.99, 45, FALSE, TRUE, 1),
('d8eebc99-9c0b-4ef8-bb6d-6bb9bd381444', 2, 'Sneakers', 'Comfortable athletic shoes', 79.99, 35, TRUE, TRUE, 1),

-- Books
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 3, 'Programming Book', 'Learn programming with this comprehensive guide', 49.99, 20, TRUE, TRUE, 1),
('e9eebc99-9c0b-4ef8-bb6d-6bb9bd381555', 3, 'Science Fiction Novel', 'Bestselling sci-fi adventure', 24.99, 30, FALSE, TRUE, 1),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd381666', 3, 'Cookbook', 'Delicious recipes from around the world', 34.99, 25, FALSE, TRUE, 1),
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd381777', 3, 'Self-Help Book', 'Guide to personal development', 29.99, 40, FALSE, TRUE, 1),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd381888', 3, 'History Book', 'Fascinating historical events', 39.99, 15, FALSE, TRUE, 1),

-- Home & Kitchen
('c3eebc99-9c0b-4ef8-bb6d-6bb9bd381999', 4, 'Coffee Maker', 'Brew perfect coffee every morning', 89.99, 20, TRUE, TRUE, 1),
('d4eebc99-9c0b-4ef8-bb6d-6bb9bd382000', 4, 'Blender', 'Powerful blender for smoothies and more', 69.99, 25, FALSE, TRUE, 1),
('e5eebc99-9c0b-4ef8-bb6d-6bb9bd382111', 4, 'Bedding Set', 'Soft and comfortable bedding', 99.99, 15, FALSE, TRUE, 1),
('f6eebc99-9c0b-4ef8-bb6d-6bb9bd382222', 4, 'Toaster', '4-slice toaster with multiple settings', 49.99, 30, FALSE, TRUE, 1),
('a7eebc99-9c0b-4ef8-bb6d-6bb9bd382333', 4, 'Cookware Set', 'Complete set of non-stick cookware', 149.99, 10, FALSE, TRUE, 1),

-- Sports & Outdoors
('b8eebc99-9c0b-4ef8-bb6d-6bb9bd382444', 5, 'Yoga Mat', 'Non-slip yoga mat for exercise', 29.99, 50, FALSE, TRUE, 1),
('c9eebc99-9c0b-4ef8-bb6d-6bb9bd382555', 5, 'Dumbbells', 'Set of adjustable dumbbells', 119.99, 20, TRUE, TRUE, 1),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd382666', 5, 'Tennis Racket', 'Professional tennis racket', 89.99, 15, FALSE, TRUE, 1),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd382777', 5, 'Hiking Backpack', 'Durable backpack for outdoor adventures', 79.99, 25, FALSE, TRUE, 1),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd382888', 5, 'Basketball', 'Official size basketball', 39.99, 30, FALSE, TRUE, 1),

-- Beauty & Personal Care
('a3eebc99-9c0b-4ef8-bb6d-6bb9bd382999', 6, 'Facial Cleanser', 'Gentle cleanser for all skin types', 24.99, 40, FALSE, TRUE, 1),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd383000', 6, 'Hair Dryer', 'Professional-grade hair dryer', 59.99, 20, FALSE, TRUE, 1),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd383111', 6, 'Perfume', 'Luxury fragrance for special occasions', 89.99, 15, TRUE, TRUE, 1),
('d6eebc99-9c0b-4ef8-bb6d-6bb9bd383222', 6, 'Makeup Set', 'Complete makeup kit for beginners', 49.99, 25, FALSE, TRUE, 1),
('e7eebc99-9c0b-4ef8-bb6d-6bb9bd383333', 6, 'Electric Toothbrush', 'Advanced cleaning technology', 79.99, 30, FALSE, TRUE, 1);

-- Insert product images
INSERT INTO product_images (uuid, p_id, image_path, is_featured, is_active, created_by)
VALUES
-- Electronics
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 1, '/uploads/products/smartphone.jpg', TRUE, TRUE, 1),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 2, '/uploads/products/laptop.jpg', TRUE, TRUE, 1),
('f8eebc99-9c0b-4ef8-bb6d-6bb9bd383444', 3, '/uploads/products/earbuds.jpg', TRUE, TRUE, 1),
('a9eebc99-9c0b-4ef8-bb6d-6bb9bd383555', 4, '/uploads/products/smartwatch.jpg', TRUE, TRUE, 1),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd383666', 5, '/uploads/products/tablet.jpg', TRUE, TRUE, 1),

-- Clothing
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380ccc', 6, '/uploads/products/tshirt.jpg', TRUE, TRUE, 1),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd383777', 7, '/uploads/products/jeans.jpg', TRUE, TRUE, 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd383888', 8, '/uploads/products/hoodie.jpg', TRUE, TRUE, 1),
('f3eebc99-9c0b-4ef8-bb6d-6bb9bd383999', 9, '/uploads/products/dress_shirt.jpg', TRUE, TRUE, 1),
('a4eebc99-9c0b-4ef8-bb6d-6bb9bd384000', 10, '/uploads/products/sneakers.jpg', TRUE, TRUE, 1),

-- Books
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', 11, '/uploads/products/programming_book.jpg', TRUE, TRUE, 1),
('b5eebc99-9c0b-4ef8-bb6d-6bb9bd384111', 12, '/uploads/products/scifi_novel.jpg', TRUE, TRUE, 1),
('c6eebc99-9c0b-4ef8-bb6d-6bb9bd384222', 13, '/uploads/products/cookbook.jpg', TRUE, TRUE, 1),
('d7eebc99-9c0b-4ef8-bb6d-6bb9bd384333', 14, '/uploads/products/selfhelp_book.jpg', TRUE, TRUE, 1),
('e8eebc99-9c0b-4ef8-bb6d-6bb9bd384444', 15, '/uploads/products/history_book.jpg', TRUE, TRUE, 1),

-- Additional images (non-featured)
('f9eebc99-9c0b-4ef8-bb6d-6bb9bd384555', 1, '/uploads/products/smartphone_back.jpg', FALSE, TRUE, 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd384666', 1, '/uploads/products/smartphone_side.jpg', FALSE, TRUE, 1),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd384777', 2, '/uploads/products/laptop_open.jpg', FALSE, TRUE, 1),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd384888', 2, '/uploads/products/laptop_keyboard.jpg', FALSE, TRUE, 1),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd384999', 6, '/uploads/products/tshirt_back.jpg', FALSE, TRUE, 1);
