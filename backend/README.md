# E-Commerce API Backend

A RESTful API backend for an e-commerce application, built with Node.js, Express, and MySQL.

## Features

- User authentication with JWT
- Email verification with token-based system
- Token refresh mechanism with maximum refresh limit
- Product categories management
- Product management with image uploads
- Shopping cart functionality
- Product reviews and ratings
- Payment processing with Stripe integration
- File uploads for bulk product imports
- MVC architecture with service layer
- Raw SQL queries with transaction support
- Input validation with express-validator
- Comprehensive error handling
- Role-based access control (Admin/Customer)

## Prerequisites

- Node.js (v16+)
- MySQL
- npm or yarn
- SMTP server for email functionality
- Stripe account for payment processing

## Setup

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a MySQL database
5. Configure environment variables (create a `.env` file in the root directory):

   ```
   # Server Configuration
   PORT=8000
   FRONTEND_URL=http://localhost:5173

   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=your_db_name

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   TOKEN_EXPIRES_IN_MINUTES=60
   REFRESH_TOKEN_MAX_REFRESHES=5

   # Email Configuration
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   EMAIL_FROM=noreply@example.com

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ```

6. Run the SQL script to create tables and sample data:
   ```
   mysql -u your_db_user -p your_db_name < sample.sql
   ```
7. Start the server:
   ```
   npm run dev
   ```

The server will start on port 8000 (or the port specified in your .env file).

## API Endpoints

### Auth

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login
- `POST /api/users/refresh-token` - Refresh authentication token
- `GET /api/users/verify-email/:token` - Verify email address
- `POST /api/users/resend-verification` - Resend verification email

### User Management

- `GET /api/users/all` - Get all users (admin only)
- `POST /api/users/activateDeactivate` - Activate or deactivate a user account

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:uuid` - Get a specific category
- `POST /api/categories` - Create a new category (admin only)
- `PUT /api/categories/:uuid` - Update a category (admin only)
- `DELETE /api/categories/:uuid` - Delete a category (admin only)

### Products

- `GET /api/products` - Get all products
- `GET /api/products/search` - Search products with filters
- `GET /api/products/:uuid` - Get a specific product
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:uuid` - Update a product (admin only)
- `DELETE /api/products/:uuid` - Delete a product (admin only)

### Product Images

- `GET /api/products/images/:productUuid` - Get all images for a product
- `POST /api/products/images/:productUuid` - Add an image to a product (admin only)
- `PUT /api/products/images/:uuid` - Update an image (admin only)
- `DELETE /api/products/images/:uuid` - Delete an image (admin only)

### Product Reviews

- `GET /api/reviews/product/:productUuid` - Get reviews for a product
- `GET /api/reviews/:uuid` - Get a specific review
- `POST /api/reviews` - Create a product review (authenticated users)
- `PUT /api/reviews/:uuid` - Update a review (owner only)
- `DELETE /api/reviews/:uuid` - Delete a review (owner or admin)

### Shopping Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:uuid` - Update cart item quantity
- `PUT /api/cart/items/batch` - Batch update cart items
- `DELETE /api/cart/items/deactivate/:uuid` - Remove item from cart
- `DELETE /api/cart/items/deactivateAll` - Clear cart
- `POST /api/cart/complete-order` - Complete order

### Payments

- `POST /api/payments/create-checkout-session` - Create Stripe checkout session
- `POST /api/payments/webhook` - Handle Stripe webhook events

### File Uploads

- `POST /api/uploads/upload` - Upload files for bulk product import

### Email Testing

- `POST /api/email-test/send` - Send test email

## Authentication

For protected routes, include the JWT token in the request header:

```
Authorization: Bearer your_jwt_token
```

## Error Handling

The API uses standard HTTP status codes:

- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error

## Code Organization

The backend follows a structured organization:

- `config/` - Configuration files
- `constants/` - Application constants
- `controllers/` - Request handlers
- `middlewares/` - Express middlewares
- `models/` - Database models
- `routes/` - API routes
- `services/` - Business logic
- `validations/` - Input validation schemas
- `uploads/` - File upload directory
