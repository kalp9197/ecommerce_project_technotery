# E-Commerce API Backend

A RESTful API backend for an e-commerce application, built with Node.js, Express, and MySQL.

## Features

- User authentication with JWT
- Product categories management
- Product management with images
- MVC architecture
- Raw SQL queries
- Input validation with express-validator
- Proper error handling

## Prerequisites

- Node.js (v16+)
- MySQL
- npm or yarn

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
   PORT=8000
   ORIGIN_URL=http://localhost:5173
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=your_db_name
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
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

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a specific category
- `POST /api/categories` - Create a new category (requires auth)
- `PUT /api/categories/:id` - Update a category (requires auth)
- `DELETE /api/categories/:id` - Delete a category (requires auth)

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product (requires auth)
- `PUT /api/products/:id` - Update a product (requires auth)
- `DELETE /api/products/:id` - Delete a product (requires auth)

### Product Images

- `GET /api/products/:productId/images` - Get all images for a product
- `POST /api/products/:productId/images` - Add an image to a product (requires auth)
- `PUT /api/products/images/:id` - Update an image (requires auth)
- `DELETE /api/products/images/:id` - Delete an image (requires auth)

## Authentication

For protected routes, include the JWT token in the request header:

```
Authorization: Bearer your_jwt_token
```

## Error Codes

The API uses standard HTTP status codes:

- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error
