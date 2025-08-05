const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        console.log('Auth headers:', req.headers);
        const authHeader = req.headers['authorization'];
        console.log('Authorization header:', authHeader);
        
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        // Check if JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        
        console.log('Verifying token with JWT secret length:', process.env.JWT_SECRET.length);
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT verification error:', err.message);
                return res.status(403).json({ message: 'Invalid token', error: err.message });
            }
            
            console.log('Authenticated user:', user);
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({ message: 'Authentication error', error: error.message });
    }
};

module.exports = authenticateToken;
