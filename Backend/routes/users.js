const express = require('express');
const db = require('../database/connection');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const query = 'SELECT user_id, name, email, phone_number, driving_license_number, address, date_of_birth, registration_date FROM Users WHERE user_id = ?';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(results[0]);
    });
});

// Get user violations
router.get('/violations', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const query = `
        SELECT v.*, o.officer_name, p.payment_amount, p.payment_date, p.receipt_file
        FROM Violations v
        LEFT JOIN Officers o ON v.officer_id = o.officer_id
        LEFT JOIN Payments p ON v.violation_id = p.violation_id
        WHERE v.user_id = ?
        ORDER BY v.violation_date DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json(results);
    });
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { name, phone_number, address } = req.body;
    
    const query = 'UPDATE Users SET name = ?, phone_number = ?, address = ? WHERE user_id = ?';
    
    db.query(query, [name, phone_number, address, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json({ message: 'Profile updated successfully' });
    });
});

module.exports = router;
