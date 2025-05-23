-- Insert admin user (password: Admin@123)
INSERT INTO users (uuid, name, email, password, is_active, is_admin, email_verified)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin',
  'admin@example.com',
  '$2a$10$ixlPY3AAd4ty1l6E2IsQ9OFZi2ba9ZQE0bP7RFcGIWNhyFrrT3YUi',
  TRUE,
  TRUE,
  TRUE
);

-- Insert regular users (password: User@123)
INSERT INTO users (uuid, name, email, password, is_active, is_admin, email_verified)
VALUES
(
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'user',
  'user@example.com',
  '$2a$10$zGqGe.KxpnA5K0xRkE9ELebNpZ.pknOVkOuVRn1.CvUmEL8qCCjNu',
  TRUE,
  FALSE,
  TRUE
),
(
  'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'Jane Smith',
  'jane@example.com',
  '$2a$10$zGqGe.KxpnA5K0xRkE9ELebNpZ.pknOVkOuVRn1.CvUmEL8qCCjNu',
  TRUE,
  FALSE,
  TRUE
),
(
  'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'Robert Johnson',
  'robert@example.com',
  '$2a$10$zGqGe.KxpnA5K0xRkE9ELebNpZ.pknOVkOuVRn1.CvUmEL8qCCjNu',
  TRUE,
  FALSE,
  TRUE
),
(
  'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  'Emily Davis',
  'emily@example.com',
  '$2a$10$zGqGe.KxpnA5K0xRkE9ELebNpZ.pknOVkOuVRn1.CvUmEL8qCCjNu',
  TRUE,
  FALSE,
  TRUE
),
(
  'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
  'Michael Wilson',
  'michael@example.com',
  '$2a$10$zGqGe.KxpnA5K0xRkE9ELebNpZ.pknOVkOuVRn1.CvUmEL8qCCjNu',
  TRUE,
  FALSE,
  FALSE
);

-- Insert user tokens for verification
INSERT INTO user_tokens (uuid, user_id, token, expires_at, is_expired, refresh_cycles)
VALUES
(
  'a5eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
  1,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYTBlZWJjOTktOWMwYi00ZWY4LWJiNmQtNmJiOWJkMzgwYTExIiwiaWF0IjoxNjE1MjQ5MDIyLCJleHAiOjE2MTUyNTI2MjJ9.3Thp81rDFrKXr3WrY1MyMnNK8kKoZBX9lg',
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  FALSE,
  5
),
(
  'b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
  2,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYjBlZWJjOTktOWMwYi00ZWY4LWJiNmQtNmJiOWJkMzgwYTIyIiwiaWF0IjoxNjE1MjQ5MDIyLCJleHAiOjE2MTUyNTI2MjJ9.4Thp81rDFrKXr3WrY1MyMnNK8kKoZBX9lg',
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  FALSE,
  5
),
(
  'c7eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
  3,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYzFlZWJjOTktOWMwYi00ZWY4LWJiNmQtNmJiOWJkMzgwYTMzIiwiaWF0IjoxNjE1MjQ5MDIyLCJleHAiOjE2MTUyNTI2MjJ9.5Thp81rDFrKXr3WrY1MyMnNK8kKoZBX9lg',
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  FALSE,
  5
),
(
  'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa',
  6,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiZjRlZWJjOTktOWMwYi00ZWY4LWJiNmQtNmJiOWJkMzgwYTY2IiwiaWF0IjoxNjE1MjQ5MDIyLCJleHAiOjE2MTUyNTI2MjJ9.6Thp81rDFrKXr3WrY1MyMnNK8kKoZBX9lg',
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  FALSE,
  5
);
