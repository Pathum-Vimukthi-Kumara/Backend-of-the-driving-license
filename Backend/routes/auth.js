const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone_number, driving_license_number, password, address, date_of_birth } = req.body;

        // Check if user already exists
        const checkUser = 'SELECT * FROM Users WHERE email = ? OR driving_license_number = ?';
        db.query(checkUser, [email, driving_license_number], async (err, results) => {
            if (err) {
                console.error('Database error during user check:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'User already exists with this email or license number' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);            // Insert new user
            const insertUser = 'INSERT INTO Users (name, email, phone_number, driving_license_number, password, address, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(insertUser, [name, email, phone_number, driving_license_number, hashedPassword, address, date_of_birth], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error creating user', error: err });
                }

                const userId = result.insertId;

                // Link any existing violations for this license number
                const linkViolations = 'UPDATE Violations SET user_id = ? WHERE driving_license_number = ? AND user_id IS NULL';
                db.query(linkViolations, [userId, driving_license_number], (err, linkResult) => {
                    if (err) {
                        console.error('Error linking violations:', err);
                        // Don't fail registration if violation linking fails
                    } else if (linkResult.affectedRows > 0) {
                        console.log(`Linked ${linkResult.affectedRows} existing violations to user ${userId}`);
                    }
                });

                res.status(201).json({ 
                    message: 'User registered successfully', 
                    userId: userId,
                    linkedViolations: true
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// User Login
router.post('/login', (req, res) => {
    try {
        console.log('Login attempt received:', req.body);
        console.log('Request headers:', req.headers);
        
        const { email, password, userType } = req.body;

        let table, query;
        switch (userType) {
            case 'user':
                table = 'Users';
                query = 'SELECT user_id as id, name, email, password FROM Users WHERE email = ?';
                break;
            case 'officer':
                table = 'Officers';
                query = 'SELECT officer_id as id, officer_name as name, officer_email as email, password, role FROM Officers WHERE officer_email = ?';
                break;
            case 'admin':
                table = 'Admin';
                query = 'SELECT admin_id as id, admin_name as name, admin_email as email, admin_password as password FROM Admin WHERE admin_email = ?';
                break;
            default:
                return res.status(400).json({ message: 'Invalid user type' });
        }

        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }

            if (results.length === 0) {
                console.log(`No user found with email: ${email} and type: ${userType}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const user = results[0];
            const passwordField = userType === 'admin' ? user.admin_password || user.password : user.password;
            
            const isValidPassword = await bcrypt.compare(password, passwordField);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    userType: userType,
                    role: user.role || userType 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    userType: userType,
                    role: user.role || userType
                }
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
