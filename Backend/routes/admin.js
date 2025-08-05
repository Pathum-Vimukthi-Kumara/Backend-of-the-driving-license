const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, (req, res) => {
    // Check if user is admin
    if (req.user.userType !== 'admin' && req.user.role !== 'admin') {
        console.log('Unauthorized access attempt to admin dashboard:', req.user);
        return res.status(403).json({ message: 'Access forbidden: Admin privileges required' });
    }
    
    console.log('Admin dashboard access by:', req.user);
    
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM Users',
        totalOfficers: 'SELECT COUNT(*) as count FROM Officers',
        totalViolations: 'SELECT COUNT(*) as count FROM Violations',
        totalPayments: 'SELECT COUNT(*) as count FROM Payments',
        pendingPayments: 'SELECT COUNT(*) as count FROM Violations WHERE payment_status = "Pending"',
        paidPayments: 'SELECT COUNT(*) as count FROM Violations WHERE payment_status = "Paid"'
    };
    
    const results = {};
    let completed = 0;
    
    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            
            results[key] = result[0].count;
            completed++;
            
            if (completed === Object.keys(queries).length) {
                res.json(results);
            }
        });
    });
});

// Get all users
router.get('/users', authenticateToken, (req, res) => {
    try {
        const query = 'SELECT user_id, name, email, phone_number, driving_license_number, address, date_of_birth, registration_date FROM Users ORDER BY registration_date DESC';
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error in /admin/users:', err);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }
            
            res.json(results);
        });
    } catch (error) {
        console.error('Exception in /admin/users route:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all officers
router.get('/officers', authenticateToken, (req, res) => {
    const query = 'SELECT officer_id, officer_name, officer_email, officer_phone, role, registration_date FROM Officers ORDER BY registration_date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json(results);
    });
});

// Create new officer
router.post('/officers', authenticateToken, async (req, res) => {
    try {
        const { officer_name, officer_email, officer_phone, password, role } = req.body;
        
        // Check if officer already exists
        const checkOfficer = 'SELECT * FROM Officers WHERE officer_email = ?';
        db.query(checkOfficer, [officer_email], async (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ message: 'Officer already exists with this email' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new officer
            const insertOfficer = 'INSERT INTO Officers (officer_name, officer_email, officer_phone, password, role) VALUES (?, ?, ?, ?, ?)';
            db.query(insertOfficer, [officer_name, officer_email, officer_phone, hashedPassword, role], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error creating officer', error: err });
                }
                
                res.status(201).json({ message: 'Officer created successfully', officerId: result.insertId });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user
router.put('/users/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const { name, email, phone_number, driving_license_number, date_of_birth, address } = req.body;
    
    // Check if user exists
    const checkUser = 'SELECT user_id FROM Users WHERE user_id = ?';
    db.query(checkUser, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update user
        const updateQuery = `
            UPDATE Users 
            SET name = ?, email = ?, phone_number = ?, driving_license_number = ?, 
                date_of_birth = ?, address = ?
            WHERE user_id = ?
        `;
        
        db.query(updateQuery, [name, email, phone_number, driving_license_number, date_of_birth, address, userId], (err, result) => {
            if (err) {
                // Check for duplicate email or license number
                if (err.code === 'ER_DUP_ENTRY') {
                    if (err.sqlMessage.includes('email')) {
                        return res.status(400).json({ message: 'Email already exists' });
                    } else if (err.sqlMessage.includes('driving_license_number')) {
                        return res.status(400).json({ message: 'Driving license number already exists' });
                    }
                }
                return res.status(500).json({ message: 'Database error', error: err });
            }
            
            res.json({ message: 'User updated successfully' });
        });
    });
});

// Delete user
router.delete('/users/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    
    const query = 'DELETE FROM Users WHERE user_id = ?';
    
    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    });
});

// Delete officer
router.delete('/officers/:id', authenticateToken, (req, res) => {
    const officerId = req.params.id;
    
    const query = 'DELETE FROM Officers WHERE officer_id = ?';
    
    db.query(query, [officerId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Officer not found' });
        }
        
        res.json({ message: 'Officer deleted successfully' });
    });
});

// Confirm payment
router.put('/payments/:id/confirm', authenticateToken, (req, res) => {
    const paymentId = req.params.id;
    
    // Check if payment exists
    const checkPayment = 'SELECT payment_id, violation_id FROM Payments WHERE payment_id = ?';
    db.query(checkPayment, [paymentId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        const violationId = result[0].violation_id;
        
        // Update payment status to confirmed
        const updatePayment = 'UPDATE Payments SET status = "Confirmed" WHERE payment_id = ?';
        db.query(updatePayment, [paymentId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error', error: err });
            }
              // Update corresponding violation status to Paid
            const updateViolation = 'UPDATE Violations SET payment_status = "Paid" WHERE violation_id = ?';
            db.query(updateViolation, [violationId], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Database error', error: err });
                }
                
                res.json({ message: 'Payment confirmed successfully' });
            });
        });
    });
});

// Get user violations
router.get('/users/:id/violations', authenticateToken, (req, res) => {
    const userId = req.params.id;
    
    const query = `
        SELECT v.*, 
               o.officer_name,
               p.payment_amount, p.payment_date, p.receipt_file, p.status as payment_confirmation_status
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

module.exports = router;
