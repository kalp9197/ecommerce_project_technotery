-- Insert wishlists for users
INSERT INTO wishlist (uuid, user_id, is_active)
VALUES 
('r4eebc99-9c0b-4ef8-bb6d-6bb9bd389000', 2, TRUE),
('s5eebc99-9c0b-4ef8-bb6d-6bb9bd389111', 3, TRUE),
('t6eebc99-9c0b-4ef8-bb6d-6bb9bd389222', 4, TRUE),
('u7eebc99-9c0b-4ef8-bb6d-6bb9bd389333', 5, TRUE);

-- Insert wishlist items for John Doe (user_id = 2)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES 
('v8eebc99-9c0b-4ef8-bb6d-6bb9bd389444', 1, 2, TRUE),
('w9eebc99-9c0b-4ef8-bb6d-6bb9bd389555', 1, 4, TRUE),
('x0eebc99-9c0b-4ef8-bb6d-6bb9bd389666', 1, 10, TRUE),
('y1eebc99-9c0b-4ef8-bb6d-6bb9bd389777', 1, 18, TRUE),
('z2eebc99-9c0b-4ef8-bb6d-6bb9bd389888', 1, 22, FALSE);

-- Insert wishlist items for Jane Smith (user_id = 3)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES 
('a3eebc99-9c0b-4ef8-bb6d-6bb9bd389999', 2, 5, TRUE),
('b4eebc99-9c0b-4ef8-bb6d-6bb9bd390000', 2, 9, TRUE),
('c5eebc99-9c0b-4ef8-bb6d-6bb9bd390111', 2, 13, TRUE),
('d6eebc99-9c0b-4ef8-bb6d-6bb9bd390222', 2, 17, FALSE);

-- Insert wishlist items for Robert Johnson (user_id = 4)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES 
('e7eebc99-9c0b-4ef8-bb6d-6bb9bd390333', 3, 3, TRUE),
('f8eebc99-9c0b-4ef8-bb6d-6bb9bd390444', 3, 7, TRUE),
('g9eebc99-9c0b-4ef8-bb6d-6bb9bd390555', 3, 11, TRUE),
('h0eebc99-9c0b-4ef8-bb6d-6bb9bd390666', 3, 15, TRUE),
('i1eebc99-9c0b-4ef8-bb6d-6bb9bd390777', 3, 19, TRUE),
('j2eebc99-9c0b-4ef8-bb6d-6bb9bd390888', 3, 23, TRUE);

-- Insert wishlist items for Emily Davis (user_id = 5)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES 
('k3eebc99-9c0b-4ef8-bb6d-6bb9bd390999', 4, 1, TRUE),
('l4eebc99-9c0b-4ef8-bb6d-6bb9bd391000', 4, 8, TRUE),
('m5eebc99-9c0b-4ef8-bb6d-6bb9bd391111', 4, 16, TRUE),
('n6eebc99-9c0b-4ef8-bb6d-6bb9bd391222', 4, 24, TRUE),
('o7eebc99-9c0b-4ef8-bb6d-6bb9bd391333', 4, 28, TRUE),
('p8eebc99-9c0b-4ef8-bb6d-6bb9bd391444', 4, 12, FALSE);
