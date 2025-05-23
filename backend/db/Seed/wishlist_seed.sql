-- Insert wishlists for users
INSERT INTO wishlist (uuid, user_id, is_active)
VALUES
('a4eebc99-9c0b-4ef8-bb6d-6bb9bd389000', 2, TRUE),
('b5eebc99-9c0b-4ef8-bb6d-6bb9bd389111', 3, TRUE),
('c6eebc99-9c0b-4ef8-bb6d-6bb9bd389222', 4, TRUE),
('d7eebc99-9c0b-4ef8-bb6d-6bb9bd389333', 5, TRUE);

-- Insert wishlist items for John Doe (user_id = 2)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES
('e8eebc99-9c0b-4ef8-bb6d-6bb9bd389444', 1, 2, TRUE),
('f9eebc99-9c0b-4ef8-bb6d-6bb9bd389555', 1, 4, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd389666', 1, 10, TRUE),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd389777', 1, 18, TRUE),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd389888', 1, 22, FALSE);

-- Insert wishlist items for Jane Smith (user_id = 3)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd389999', 2, 5, TRUE),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd390000', 2, 9, TRUE),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd390111', 2, 13, TRUE),
('a6eebc99-9c0b-4ef8-bb6d-6bb9bd390222', 2, 17, FALSE);

-- Insert wishlist items for Robert Johnson (user_id = 4)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES
('b7eebc99-9c0b-4ef8-bb6d-6bb9bd390333', 3, 3, TRUE),
('c8eebc99-9c0b-4ef8-bb6d-6bb9bd390444', 3, 7, TRUE),
('d9eebc99-9c0b-4ef8-bb6d-6bb9bd390555', 3, 11, TRUE),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd390666', 3, 15, TRUE),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd390777', 3, 19, TRUE),
('a2eebc99-9c0b-4ef8-bb6d-6bb9bd390888', 3, 23, TRUE);

-- Insert wishlist items for Emily Davis (user_id = 5)
INSERT INTO wishlist_items (uuid, wishlist_id, product_id, is_active)
VALUES
('b3eebc99-9c0b-4ef8-bb6d-6bb9bd390999', 4, 1, TRUE),
('c4eebc99-9c0b-4ef8-bb6d-6bb9bd391000', 4, 8, TRUE),
('d5eebc99-9c0b-4ef8-bb6d-6bb9bd391111', 4, 16, TRUE),
('e6eebc99-9c0b-4ef8-bb6d-6bb9bd391222', 4, 24, TRUE),
('f7eebc99-9c0b-4ef8-bb6d-6bb9bd391333', 4, 28, TRUE),
('a8eebc99-9c0b-4ef8-bb6d-6bb9bd391444', 4, 12, FALSE);
