const express = require('express');
const db = require('../database/connection');
const authenticateToken = require('../middleware/auth');
const { upload, processUpload } = require('../utils/fileUpload');
const router = express.Router();

// Submit payment
router.post('/', authenticateToken, upload.single('receipt'), (req, res) => {
    const { violation_id, payment_amount } = req.body;
    
    // Process the uploaded file (works in both serverless and regular environments)
    const receipt_file = processUpload(req);
    
    if (!receipt_file) {
        return res.status(400).json({ message: 'Receipt file is required' });
    }
    
    const query = 'INSERT INTO Payments (violation_id, payment_amount, receipt_file) VALUES (?, ?, ?)';
    db.query(query, [violation_id, payment_amount, receipt_file], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        // Update violation to mark payment as submitted (but still pending admin approval)
        const updateQuery = 'UPDATE Violations SET payment_submitted = TRUE WHERE violation_id = ?';
        db.query(updateQuery, [violation_id], (err) => {
            if (err) {
                console.error('Error updating violation payment_submitted status:', err);
            }
        });
        
        res.status(201).json({ 
            message: 'Payment submitted successfully and is pending admin approval', 
            paymentId: result.insertId 
        });
    });
});

// Get all payments (for admin)
router.get('/', authenticateToken, (req, res) => {
    const query = `
        SELECT p.*, v.violation_type, v.fine_amount, u.name as user_name, u.driving_license_number
        FROM Payments p
        LEFT JOIN Violations v ON p.violation_id = v.violation_id
        LEFT JOIN Users u ON v.user_id = u.user_id
        ORDER BY p.payment_date DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json(results);
    });
});

// Get payment by violation ID
router.get('/violation/:violationId', authenticateToken, (req, res) => {
    const violationId = req.params.violationId;
    
    const query = 'SELECT * FROM Payments WHERE violation_id = ?';
    
    db.query(query, [violationId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        
        res.json(results);
    });
});

module.exports = router;
