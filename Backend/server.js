const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Log environment details to help with debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Working directory:', __dirname);
console.log('Available files in root:', fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : 'Directory not accessible');

// Load environment variables
try {
    require('dotenv').config();
    console.log('Environment variables loaded. JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('Database host:', process.env.DB_HOST || '(not set in env)');
} catch (err) {
    console.error('Error loading .env file:', err);
}

// Global error handlers for unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const app = express();

// Middleware with error handling
app.use(cors({
    origin: ['http://localhost:3000', 'https://driving-license-tracker.vercel.app', 'https://driving-license-tracker-tmrx.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// Request parsing with size limits to prevent attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Set up uploads directory with error handling
try {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        console.log('Creating uploads directory');
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/uploads', express.static(uploadsDir));
    console.log('Uploads directory configured');
} catch (err) {
    console.error('Error setting up uploads directory:', err);
}

// Health check route for Vercel
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'API is running',
        env: process.env.NODE_ENV || 'development' 
    });
});

// Special test route for auth POST
app.post('/api/auth/test', (req, res) => {
    console.log('POST /api/auth/test route hit!', req.body);
    res.status(200).json({ 
        message: 'Auth POST endpoint is working correctly',
        received: req.body,
        headers: req.headers
    });
});

// Root route for Vercel - catches direct access to backend URL
app.get('/', (req, res) => {
    res.status(200).send('Driving License Tracking System API - Server is running');
});

// Routes with error handling
try {
    // Mount auth routes both at /api/auth and directly at /auth for compatibility
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    app.use('/auth', authRoutes); // Direct access for auth routes
    
    app.use('/api/users', require('./routes/users'));
    app.use('/api/officers', require('./routes/officers'));
    app.use('/api/violations', require('./routes/violations'));
    app.use('/api/payments', require('./routes/payments'));
    app.use('/api/admin', require('./routes/admin'));
    console.log('All routes loaded successfully');
} catch (error) {
    console.error('Error setting up routes:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

const PORT = process.env.PORT || 5000;

// For local development
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// For Vercel deployment
module.exports = app;
