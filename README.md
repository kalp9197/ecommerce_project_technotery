# Full Stack E-Commerce Application

A modern e-commerce application with React frontend and Express backend.

## Project Structure

This project is divided into two parts:

- `frontend/`: React + Vite application
- `backend/`: Express API server

## Deployment Instructions

### Backend Deployment to Railway

1. Create a Railway account at [https://railway.app](https://railway.app)

2. Install Railway CLI (optional):

   ```bash
   npm i -g @railway/cli
   ```

3. Login to Railway:

   ```bash
   railway login
   ```

4. Create a new project:

   ```bash
   railway init
   ```

5. Navigate to the backend directory:

   ```bash
   cd backend
   ```

6. Deploy to Railway:

   ```bash
   railway up
   ```

7. Set up environment variables in Railway dashboard:

   - Go to your project in Railway dashboard
   - Click on "Variables" tab
   - Add all environment variables from `.env` file with appropriate values

8. Set up MySQL database in Railway:
   - Click "New" and select MySQL
   - Connect it to your project
   - Use the provided credentials in your environment variables

### Frontend Deployment to Netlify

1. Create a Netlify account at [https://netlify.com](https://netlify.com)

2. Install Netlify CLI (optional):

   ```bash
   npm i -g netlify-cli
   ```

3. Build your frontend project:

   ```bash
   cd frontend
   npm run build
   ```

4. Deploy to Netlify using Git:

   - Connect your GitHub/GitLab/Bitbucket repository to Netlify
   - Set build command to `cd frontend && npm run build`
   - Set publish directory to `frontend/dist`

5. Set environment variables in Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add `VITE_API_URL` with your Railway backend URL (e.g., https://your-app-name.railway.app/api)

## Local Development

### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your local database settings:

   ```
   PORT=8000
   ORIGIN_URL=http://localhost:5173
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=your_db_name
   JWT_SECRET=your-dev-secret-key
   TOKEN_EXPIRES_IN_MINUTES=10000
   REFRESH_TOKEN_CYCLES=5
   ```

4. Run the SQL script to create tables:

   ```bash
   mysql -u your_db_user -p your_db_name < sample.sql
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```
   NODE_ENV=development
   VITE_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- User authentication with JWT
- Product categories management
- Product management with images
- Responsive design with Tailwind CSS
- Modern React with hooks
- Express API with proper error handling

## Technologies

### Frontend

- React 19
- Vite 6
- Tailwind CSS
- React Router
- Axios
- Radix UI Components

### Backend

- Node.js
- Express
- MySQL
- JWT Authentication
- ES Modules
