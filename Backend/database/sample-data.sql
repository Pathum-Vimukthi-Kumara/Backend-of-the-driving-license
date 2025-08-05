-- Database initialization script for Driving License Tracking System

-- Insert sample admin user
INSERT INTO Admin (admin_name, admin_email, admin_password) VALUES 
('System Admin', 'admin@system.com', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO');
-- Password: admin123

-- Insert sample officers
INSERT INTO Officers (officer_name, officer_email, officer_phone, password, role) VALUES 
('Officer John Smith', 'john.smith@police.gov', '555-0101', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO', 'Police Officer'),
('Officer Jane Doe', 'jane.doe@police.gov', '555-0102', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO', 'Police Officer'),
('Admin Officer', 'admin.officer@police.gov', '555-0103', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO', 'Admin');
-- Password for all: officer123

-- Insert sample users
INSERT INTO Users (name, email, phone_number, driving_license_number, password, address, date_of_birth) VALUES 
('Alice Johnson', 'alice@email.com', '555-1001', 'DL12345678', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO', '123 Main St, City, State', '1990-05-15'),
('Bob Wilson', 'bob@email.com', '555-1002', 'DL87654321', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO', '456 Oak Ave, City, State', '1985-12-20'),
('Carol Brown', 'carol@email.com', '555-1003', 'DL11223344', '$2a$10$rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rJJe3J8J9rOzJJe3J8J9rO', '789 Pine Rd, City, State', '1992-08-10');
-- Password for all: user123

-- Insert sample violations
INSERT INTO Violations (user_id, officer_id, violation_type, violation_description, fine_amount, payment_status) VALUES 
(1, 1, 'Speeding', 'Driving 15 mph over the speed limit in a residential area', 150.00, 'Pending'),
(1, 2, 'Parking Violation', 'Parking in a no-parking zone', 75.00, 'Paid'),
(2, 1, 'Red Light', 'Running a red light at Main St intersection', 200.00, 'Pending'),
(3, 2, 'Expired Registration', 'Vehicle registration expired over 30 days', 100.00, 'Paid');

-- Insert sample payments
INSERT INTO Payments (violation_id, payment_amount, receipt_file) VALUES 
(2, 75.00, 'receipt-1234567890-parking.pdf'),
(4, 100.00, 'receipt-0987654321-registration.pdf');
