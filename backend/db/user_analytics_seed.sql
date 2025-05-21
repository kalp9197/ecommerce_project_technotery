-- Insert sample user analytics data
INSERT INTO user_analytics (uuid, user_id, event_type, product_id, quantity, search_query, metadata, created_at)
VALUES
-- User 2 (John Doe) analytics
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 2, 'product_view', 1, NULL, NULL, '{"session_id": "sess_001", "device": "desktop", "browser": "chrome"}', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 2, 'add_to_cart', 1, 2, NULL, '{"session_id": "sess_001", "device": "desktop", "browser": "chrome"}', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('e3eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 2, 'product_view', 3, NULL, NULL, '{"session_id": "sess_001", "device": "desktop", "browser": "chrome"}', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380004', 2, 'add_to_wishlist', 3, NULL, NULL, '{"session_id": "sess_001", "device": "desktop", "browser": "chrome"}', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('e5eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 2, 'search', NULL, NULL, 'smartphone', '{"session_id": "sess_001", "device": "desktop", "browser": "chrome", "results_count": 5}', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('e6eebc99-9c0b-4ef8-bb6d-6bb9bd380006', 2, 'product_view', 5, NULL, NULL, '{"session_id": "sess_001", "device": "desktop", "browser": "chrome"}', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('e7eebc99-9c0b-4ef8-bb6d-6bb9bd380007', 2, 'checkout', NULL, NULL, NULL, '{"session_id": "sess_001", "device": "desktop", "browser": "chrome", "total_amount": 599.98, "items_count": 2}', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- User 3 (Jane Smith) analytics
('e8eebc99-9c0b-4ef8-bb6d-6bb9bd380008', 3, 'product_view', 2, NULL, NULL, '{"session_id": "sess_002", "device": "mobile", "browser": "safari"}', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('e9eebc99-9c0b-4ef8-bb6d-6bb9bd380009', 3, 'add_to_cart', 2, 1, NULL, '{"session_id": "sess_002", "device": "mobile", "browser": "safari"}', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380010', 3, 'product_view', 4, NULL, NULL, '{"session_id": "sess_002", "device": "mobile", "browser": "safari"}', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380011', 3, 'add_to_wishlist', 4, NULL, NULL, '{"session_id": "sess_002", "device": "mobile", "browser": "safari"}', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380012', 3, 'search', NULL, NULL, 'headphones', '{"session_id": "sess_002", "device": "mobile", "browser": "safari", "results_count": 3}', DATE_SUB(NOW(), INTERVAL 1 DAY));
