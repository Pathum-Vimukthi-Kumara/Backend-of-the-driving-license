const express = require('express');
const db = require('../database/connection');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Create violation
router.post('/', authenticateToken, (req, res) => {
    const { user_id, driving_license_number, citizen_name, violation_type, violation_description, fine_amount } = req.body;
    const officer_id = req.user.id;
    
    // If user_id is provided, create violation for registered user
    if (user_id) {
        const query = 'INSERT INTO Violations (user_id, officer_id, violation_type, violation_description, fine_amount) VALUES (?, ?, ?, ?, ?)';
        
        db.query(query, [user_id, officer_id, violation_type, violation_description, fine_amount], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            
            res.status(201).json({ 
                message: 'Violation created successfully', 
                violationId: result.insertId 
            });
        });
    } else if (driving_license_number) {
        // Create violation for unregistered user using license number
        const query = 'INSERT INTO Violations (user_id, officer_id, violation_type, violation_description, fine_amount, driving_license_number, citizen_name) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        db.query(query, [null, officer_id, violation_type, violation_description, fine_amount, driving_license_number, citizen_name], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            
            res.status(201).json({ 
                message: 'Violation created successfully for unregistered citizen', 
                violationId: result.insertId 
            });
        });
    } else {
        return res.status(400).json({ message: 'Either user_id or driving_license_number is required' });
    }
});

// Get all violations (for admin)
router.get('/', authenticateToken, (req, res) => {
    const query = `
        SELECT v.*, 
               COALESCE(u.name, v.citizen_name) as user_name, 
               COALESCE(u.driving_license_number, v.driving_license_number) as driving_license_number, 
               u.email as user_email,
               o.officer_name, 
               p.payment_amount, p.payment_date, p.receipt_file,
               CASE WHEN u.user_id IS NULL THEN 'Unregistered' ELSE 'Registered' END as user_status
        FROM Violations v
        LEFT JOIN Users u ON v.user_id = u.user_id
        LEFT JOIN Officers o ON v.officer_id = o.officer_id
        LEFT JOIN Payments p ON v.violation_id = p.violation_id
        ORDER BY v.violation_date DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json(results);
    });
});

// Update violation status
router.put('/:id/status', authenticateToken, (req, res) => {
    const violationId = req.params.id;
    const { payment_status } = req.body;
    
    const query = 'UPDATE Violations SET payment_status = ? WHERE violation_id = ?';
    
    db.query(query, [payment_status, violationId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Violation not found' });
        }
        
        res.json({ message: 'Violation status updated successfully' });
    });
});

// Get violation by ID
router.get('/:id', authenticateToken, (req, res) => {
    const violationId = req.params.id;
    
    const query = `
        SELECT v.*, 
               COALESCE(u.name, v.citizen_name) as user_name, 
               COALESCE(u.driving_license_number, v.driving_license_number) as driving_license_number, 
               u.email as user_email,
               o.officer_name, 
               p.payment_amount, p.payment_date, p.receipt_file,
               CASE WHEN u.user_id IS NULL THEN 'Unregistered' ELSE 'Registered' END as user_status
        FROM Violations v
        LEFT JOIN Users u ON v.user_id = u.user_id
        LEFT JOIN Officers o ON v.officer_id = o.officer_id
        LEFT JOIN Payments p ON v.violation_id = p.violation_id
        WHERE v.violation_id = ?
    `;
    
    db.query(query, [violationId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Violation not found' });
        }
        
        res.json(results[0]);
    });
});

module.exports = router;
