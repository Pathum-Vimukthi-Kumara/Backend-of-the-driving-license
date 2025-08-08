# Driving License Tracking System Backend

This is a serverless backend application for the Driving License Tracking System, designed to be deployed on Vercel.

## Overview

This backend provides a REST API for managing driving license violations, payments, and user management. It is built with Node.js and Express, and is designed to work in a serverless environment.

## Features

- User authentication and authorization
- Violation tracking and management
- Payment processing with receipt uploads
- Admin dashboard functionality
- Officer management

## Serverless Architecture

This application is configured to run as serverless functions on Vercel. Key adaptations for serverless include:

- File uploads are handled in memory and temporarily stored in the `/tmp` directory (in production, should be replaced with a cloud storage service like AWS S3, Vercel Blob Store, etc.)
- Database connections are optimized for serverless environments
- API routes are designed to be stateless

## Deployment to Vercel

1. Make sure you have the Vercel CLI installed:
   ```
   npm i -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Deploy to Vercel:
   ```
   vercel
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=3306

# JWT Secret
JWT_SECRET=your-jwt-secret

# Server Configuration
PORT=5000
REACT_APP_BASE_URL=http://localhost:3000
```

Make sure to set these environment variables in your Vercel project settings as well.

## Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```

## Production Considerations

For a production deployment, consider:

1. Using a cloud storage service for file uploads
2. Implementing proper database connection pooling
3. Setting up proper CORS headers
4. Adding rate limiting and additional security measures

## License

This project is licensed under the MIT License.