-- Database initialization script for driving license tracking system

-- First, let's insert some sample admin users
INSERT INTO Admin (admin_name, admin_email, admin_password) VALUES 
('Admin User', 'admin@system.com', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2'); -- password: admin123

-- Insert sample officers
INSERT INTO Officers (officer_name, officer_email, officer_phone, password, role) VALUES 
('Officer John Smith', 'john.smith@police.com', '555-0101', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', 'Police Officer'), -- password: officer123
('Officer Jane Doe', 'jane.doe@police.com', '555-0102', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', 'Police Officer'), -- password: officer123
('Sergeant Mike Wilson', 'mike.wilson@police.com', '555-0103', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', 'Admin'); -- password: officer123

-- Insert sample users (citizens)
INSERT INTO Users (name, email, phone_number, driving_license_number, password, address, date_of_birth) VALUES 
('John Citizen', 'john.citizen@email.com', '555-1001', 'DL123456789', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', '123 Main St, City, State 12345', '1990-05-15'), -- password: user123
('Mary Johnson', 'mary.johnson@email.com', '555-1002', 'DL987654321', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', '456 Oak Ave, City, State 12345', '1985-08-22'), -- password: user123
('Robert Brown', 'robert.brown@email.com', '555-1003', 'DL456789123', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', '789 Pine Rd, City, State 12345', '1992-12-03'), -- password: user123
('Sarah Davis', 'sarah.davis@email.com', '555-1004', 'DL789123456', '$2a$10$9Xe7EqVF7YKZfn7HvKdMIuvWJhLhWEq3XZJXkjL8h5Mg8QPKqJ8q2', '321 Elm St, City, State 12345', '1988-03-10'); -- password: user123

-- Insert sample violations
INSERT INTO Violations (user_id, officer_id, violation_type, violation_description, fine_amount, payment_status) VALUES 
(1, 1, 'Speeding', 'Driving 15 kmh over the speed limit in a residential area', 5000.00, 'Pending'),
(2, 1, 'Running Red Light', 'Failed to stop at a red traffic light at Main St and Oak Ave intersection', 7500.00, 'Paid'),
(1, 2, 'Illegal Parking', 'Parked in a no-parking zone near the city center', 2500.00, 'Pending'),
(3, 2, 'Reckless Driving', 'Unsafe lane changes and aggressive driving on Highway 101', 15000.00, 'Pending'),
(4, 1, 'Expired License', 'Driving with an expired driving license', 3500.00, 'Paid'),
(2, 2, 'No Insurance', 'Driving without valid vehicle insurance', 10000.00, 'Pending');

-- Insert sample payments for paid violations
INSERT INTO Payments (violation_id, payment_amount, receipt_file) VALUES 
(2, 7500.00, 'receipt-sample-001.pdf'),
(5, 3500.00, 'receipt-sample-002.pdf');

-- Update violation payment status for completed payments
UPDATE Violations SET payment_status = 'Paid' WHERE violation_id IN (2, 5);

-- Display sample data summary
SELECT 'Sample data inserted successfully!' as message;
SELECT 'Admin Users:', COUNT(*) as count FROM Admin;
SELECT 'Officers:', COUNT(*) as count FROM Officers;
SELECT 'Users:', COUNT(*) as count FROM Users;
SELECT 'Violations:', COUNT(*) as count FROM Violations;
SELECT 'Payments:', COUNT(*) as count FROM Payments;

-- Test credentials:
-- Admin: admin@system.com / admin123
-- Officer: john.smith@police.com / officer123
-- User: john.citizen@email.com / user123
