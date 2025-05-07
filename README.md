# E-Commerce Project

A full-stack e-commerce application with a React frontend and Node.js backend.

## Project Structure

```
.
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── lib/          # Utility libraries
│   │   ├── utils/        # Helper functions
│   │   ├── App.jsx       # Main application component
│   │   └── main.jsx      # Application entry point
│   └── ...
│
├── backend/              # Node.js backend application
│   ├── controllers/      # Request handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middlewares/      # Custom middleware
│   ├── validations/      # Input validation
│   ├── config/           # Configuration files
│   ├── uploads/          # File upload directory
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
│
└── package.json          # Root package.json for running both services
```

## Technologies Used

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and development server
- **React Router v7** - For routing
- **Tailwind CSS** - For styling
- **Shadcn UI** - UI component library based on Radix UI
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client for API requests
- **Stripe JS** - Payment processing

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Request validation
- **Nodemailer** - Email functionality
- **Stripe** - Payment processing API
- **Express File Upload** - File upload handling

## Features

- User authentication (signup, login)
- Product browsing and searching
- Product categories
- Shopping cart functionality
- Product reviews
- Checkout with Stripe payment processing
- File uploads
- Email notifications

## API Routes

- `/api/users` - User management
- `/api/products` - Product management
- `/api/product-categories` - Category management
- `/api/carts` - Shopping cart operations
- `/api/product-reviews` - Product review management
- `/api/payments` - Payment processing
- `/api/file-uploads` - File upload handling

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL

### Installation

1. Clone the repository
   ```
   git clone https://github.com/kalp9197/ecommerce_project_technotery.git
   cd ecommerce_project_technotery
   ```

2. Install dependencies
   ```
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up the database
   ```
   # Import database schema
   mysql -u yourusername -p yourdatabase < backend/sample.sql
   ```

4. Configure environment variables
   Create `.env` file in the backend directory with:
   ```
   DB_HOST=localhost
   DB_USER=yourusername
   DB_PASSWORD=yourpassword
   DB_NAME=yourdatabase
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret
   ```

5. Start the development servers
   ```
   npm run dev
   ```
   This will start both frontend and backend servers concurrently.

## Development

- Frontend runs on: http://localhost:5173
- Backend API runs on: http://localhost:3000

## Building for Production

```
npm run build
```

This will build the React frontend for production deployment. 