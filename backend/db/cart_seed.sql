-- Insert carts for users
INSERT INTO cart (uuid, user_id, is_active, total_items, total_price)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380eee', 2, TRUE, 3, 769.97),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd385000', 3, TRUE, 2, 149.98),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd385111', 4, TRUE, 4, 219.96),
('d6eebc99-9c0b-4ef8-bb6d-6bb9bd385222', 5, TRUE, 1, 399.99);

-- Insert cart items for John Doe (user_id = 2)
INSERT INTO cart_items (uuid, cart_id, product_id, quantity, price, is_active)
VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380fff', 1, 1, 1, 699.99, TRUE),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 1, 6, 1, 19.99, TRUE),
('a7eebc99-9c0b-4ef8-bb6d-6bb9bd385333', 1, 3, 1, 49.99, TRUE);

-- Insert cart items for Jane Smith (user_id = 3)
INSERT INTO cart_items (uuid, cart_id, product_id, quantity, price, is_active)
VALUES
('b8eebc99-9c0b-4ef8-bb6d-6bb9bd385444', 2, 8, 1, 39.99, TRUE),
('c9eebc99-9c0b-4ef8-bb6d-6bb9bd385555', 2, 12, 1, 24.99, TRUE),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd385666', 2, 7, 1, 49.99, FALSE),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd385777', 2, 10, 1, 79.99, FALSE);

-- Insert cart items for Robert Johnson (user_id = 4)
INSERT INTO cart_items (uuid, cart_id, product_id, quantity, price, is_active)
VALUES
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd385888', 3, 6, 2, 19.99, TRUE),
('a3eebc99-9c0b-4ef8-bb6d-6bb9bd385999', 3, 13, 1, 34.99, TRUE),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd386000', 3, 14, 1, 29.99, TRUE),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd386111', 3, 21, 1, 29.99, TRUE),
('d6eebc99-9c0b-4ef8-bb6d-6bb9bd386222', 3, 26, 1, 49.99, FALSE);

-- Insert cart items for Emily Davis (user_id = 5)
INSERT INTO cart_items (uuid, cart_id, product_id, quantity, price, is_active)
VALUES
('e7eebc99-9c0b-4ef8-bb6d-6bb9bd386333', 4, 5, 1, 399.99, TRUE),
('f8eebc99-9c0b-4ef8-bb6d-6bb9bd386444', 4, 2, 1, 1299.99, FALSE);
