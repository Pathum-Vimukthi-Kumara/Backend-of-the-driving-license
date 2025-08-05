const express = require('express');
const db = require('../database/connection');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Get officer profile
router.get('/profile', authenticateToken, (req, res) => {
    const officerId = req.user.id;
    
    const query = 'SELECT officer_id, officer_name, officer_email, officer_phone, role, registration_date FROM Officers WHERE officer_id = ?';
    
    db.query(query, [officerId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Officer not found' });
        }
        
        res.json(results[0]);
    });
});

// Get violations filed by officer
router.get('/violations', authenticateToken, (req, res) => {
    const officerId = req.user.id;
    
    const query = `
        SELECT v.*, 
               COALESCE(u.name, v.citizen_name) as user_name, 
               COALESCE(u.driving_license_number, v.driving_license_number) as driving_license_number,
               u.email as user_email,
               p.payment_amount, p.payment_date, p.receipt_file,
               CASE WHEN u.user_id IS NULL THEN 'Unregistered' ELSE 'Registered' END as user_status
        FROM Violations v
        LEFT JOIN Users u ON v.user_id = u.user_id
        LEFT JOIN Payments p ON v.violation_id = p.violation_id
        WHERE v.officer_id = ?
        ORDER BY v.violation_date DESC
    `;
    
    db.query(query, [officerId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json(results);
    });
});

// Search user by license number
router.get('/search-user/:licenseNumber', authenticateToken, (req, res) => {
    const licenseNumber = req.params.licenseNumber;
    
    const userQuery = 'SELECT user_id, name, email, phone_number, driving_license_number FROM Users WHERE driving_license_number = ?';
    
    db.query(userQuery, [licenseNumber], (err, userResults) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        // Get all violations for this license number (both registered and unregistered)
        const violationsQuery = `
            SELECT v.*, 
                   COALESCE(u.name, v.citizen_name) as violator_name,
                   o.officer_name,
                   p.payment_amount, p.payment_date, p.receipt_file
            FROM Violations v
            LEFT JOIN Users u ON v.user_id = u.user_id
            LEFT JOIN Officers o ON v.officer_id = o.officer_id
            LEFT JOIN Payments p ON v.violation_id = p.violation_id
            WHERE COALESCE(u.driving_license_number, v.driving_license_number) = ?
            ORDER BY v.violation_date DESC
        `;
        
        db.query(violationsQuery, [licenseNumber], (err, violationResults) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            
            if (userResults.length === 0) {
                // User not found in database - return structure for unregistered user
                return res.json({
                    user_id: null,
                    name: null,
                    email: null,
                    phone_number: null,
                    driving_license_number: licenseNumber,
                    is_registered: false,
                    previous_violations: violationResults,
                    message: 'Citizen not registered. You can still file a violation using the license number.'
                });
            }
            
            // User found - return user data with previous violations
            res.json({
                ...userResults[0],
                is_registered: true,
                previous_violations: violationResults
            });
        });
    });
});

// Create violation for unregistered citizen
router.post('/violation-unregistered', authenticateToken, (req, res) => {
    const { driving_license_number, citizen_name, violation_type, violation_description, fine_amount } = req.body;
    const officer_id = req.user.id;
    
    const query = 'INSERT INTO Violations (user_id, officer_id, violation_type, violation_description, fine_amount, driving_license_number, citizen_name) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [null, officer_id, violation_type, violation_description, fine_amount, driving_license_number, citizen_name], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.status(201).json({ 
            message: 'Violation filed successfully for unregistered citizen', 
            violationId: result.insertId 
        });
    });
});

module.exports = router;
