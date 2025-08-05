-- =====================================================
-- DATABASE ENHANCEMENT: ADMIN-OFFICER RELATIONSHIP
-- =====================================================
-- This script addresses the missing relationship between Admins and Officers
-- Issue: Currently no tracking of which admin created/manages which officers

-- Option 1: Simple Approach - Add created_by_admin_id to Officers table
-- =================================================================

-- Add columns to track admin who created the officer
ALTER TABLE Officers 
ADD COLUMN created_by_admin_id INT NULL,
ADD COLUMN created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN last_modified_by_admin_id INT NULL,
ADD COLUMN last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add foreign key constraints
ALTER TABLE Officers 
ADD CONSTRAINT fk_officers_created_by_admin 
FOREIGN KEY (created_by_admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL;

ALTER TABLE Officers 
ADD CONSTRAINT fk_officers_modified_by_admin 
FOREIGN KEY (last_modified_by_admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_officers_created_by_admin ON Officers(created_by_admin_id);
CREATE INDEX idx_officers_modified_by_admin ON Officers(last_modified_by_admin_id);

-- Option 2: Comprehensive Approach - Create Officer Management Audit Table
-- ========================================================================

CREATE TABLE Officer_Management_Log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    officer_id INT NOT NULL,
    action_type ENUM('created', 'updated', 'activated', 'deactivated', 'deleted', 'password_reset') NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_values JSON,
    new_values JSON,
    notes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (admin_id) REFERENCES Admins(admin_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES Officers(officer_id) ON DELETE CASCADE
);

-- Create indexes for the audit table
CREATE INDEX idx_officer_mgmt_admin ON Officer_Management_Log(admin_id);
CREATE INDEX idx_officer_mgmt_officer ON Officer_Management_Log(officer_id);
CREATE INDEX idx_officer_mgmt_action ON Officer_Management_Log(action_type);
CREATE INDEX idx_officer_mgmt_date ON Officer_Management_Log(action_date);

-- Option 3: Department/Station Management (Advanced)
-- ==================================================

CREATE TABLE Departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20),
    location VARCHAR(255),
    head_admin_id INT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (head_admin_id) REFERENCES Admins(admin_id) ON DELETE SET NULL
);

CREATE TABLE Stations (
    station_id INT PRIMARY KEY AUTO_INCREMENT,
    station_name VARCHAR(100) NOT NULL,
    station_code VARCHAR(20),
    department_id INT NOT NULL,
    address TEXT,
    contact_phone VARCHAR(20),
    supervisor_officer_id INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_officer_id) REFERENCES Officers(officer_id) ON DELETE SET NULL
);

-- Add department and station references to Officers table
ALTER TABLE Officers 
ADD COLUMN department_id INT,
ADD COLUMN station_id INT,
ADD CONSTRAINT fk_officers_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_officers_station FOREIGN KEY (station_id) REFERENCES Stations(station_id) ON DELETE SET NULL;

-- Update existing officers with default department (optional)
-- INSERT INTO Departments (department_name, department_code) VALUES ('Traffic Police', 'TP001');
-- UPDATE Officers SET department_id = 1 WHERE department_id IS NULL;

-- Sample Data for Enhanced Relationships
-- =====================================

-- Insert sample departments
INSERT INTO Departments (department_name, department_code, location, contact_phone) VALUES 
('Traffic Police Department', 'TPD001', 'Colombo Central', '+94-11-2345678'),
('Highway Patrol Division', 'HPD001', 'Kandy Region', '+94-81-2345678'),
('Municipal Traffic Unit', 'MTU001', 'Galle District', '+94-91-2345678');

-- Insert sample stations
INSERT INTO Stations (station_name, station_code, department_id, address, contact_phone) VALUES 
('Colombo Traffic Station', 'CTS001', 1, 'Galle Road, Colombo 03', '+94-11-2345679'),
('Kandy Highway Station', 'KHS001', 2, 'Kandy-Colombo Highway, Kandy', '+94-81-2345679'),
('Galle Municipal Station', 'GMS001', 3, 'Main Street, Galle', '+94-91-2345679');

-- Update existing admins with departments (if needed)
-- UPDATE Admins SET department = 'Traffic Police Department' WHERE admin_id = 1;

-- Create views for easier querying
-- =================================

-- View: Officers with their managing admin information
CREATE VIEW vw_officers_with_admin AS
SELECT 
    o.officer_id,
    o.officer_name,
    o.officer_email,
    o.officer_phone,
    o.badge_number,
    o.rank,
    o.status,
    o.registration_date,
    ca.admin_name as created_by_admin_name,
    ca.email as created_by_admin_email,
    o.created_date,
    ma.admin_name as last_modified_by_admin_name,
    ma.email as last_modified_by_admin_email,
    o.last_modified_date,
    d.department_name,
    s.station_name
FROM Officers o
LEFT JOIN Admins ca ON o.created_by_admin_id = ca.admin_id
LEFT JOIN Admins ma ON o.last_modified_by_admin_id = ma.admin_id  
LEFT JOIN Departments d ON o.department_id = d.department_id
LEFT JOIN Stations s ON o.station_id = s.station_id;

-- View: Admin management statistics
CREATE VIEW vw_admin_officer_stats AS
SELECT 
    a.admin_id,
    a.admin_name,
    a.email as admin_email,
    COUNT(DISTINCT o.officer_id) as officers_created,
    COUNT(DISTINCT om.officer_id) as officers_managed,
    COUNT(DISTINCT d.department_id) as departments_managed,
    MAX(o.created_date) as last_officer_created,
    MAX(om.action_date) as last_management_action
FROM Admins a
LEFT JOIN Officers o ON a.admin_id = o.created_by_admin_id
LEFT JOIN Officer_Management_Log om ON a.admin_id = om.admin_id
LEFT JOIN Departments d ON a.admin_id = d.head_admin_id
GROUP BY a.admin_id, a.admin_name, a.email;

-- Stored Procedures for Officer Management
-- =======================================

DELIMITER //

-- Procedure to create officer with audit trail
CREATE PROCEDURE sp_create_officer_with_audit(
    IN p_admin_id INT,
    IN p_officer_name VARCHAR(255),
    IN p_officer_email VARCHAR(255),
    IN p_officer_phone VARCHAR(20),
    IN p_password VARCHAR(255),
    IN p_badge_number VARCHAR(50),
    IN p_rank VARCHAR(50),
    IN p_department_id INT,
    IN p_station_id INT,
    IN p_notes TEXT,
    OUT p_officer_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insert officer
    INSERT INTO Officers (
        officer_name, officer_email, officer_phone, password, 
        badge_number, rank, department_id, station_id,
        created_by_admin_id, created_date
    ) VALUES (
        p_officer_name, p_officer_email, p_officer_phone, p_password,
        p_badge_number, p_rank, p_department_id, p_station_id,
        p_admin_id, NOW()
    );
    
    SET p_officer_id = LAST_INSERT_ID();
    
    -- Log the action
    INSERT INTO Officer_Management_Log (
        admin_id, officer_id, action_type, notes,
        new_values
    ) VALUES (
        p_admin_id, p_officer_id, 'created', p_notes,
        JSON_OBJECT(
            'officer_name', p_officer_name,
            'officer_email', p_officer_email,
            'badge_number', p_badge_number,
            'rank', p_rank
        )
    );
    
    COMMIT;
END //

-- Procedure to update officer with audit trail
CREATE PROCEDURE sp_update_officer_with_audit(
    IN p_admin_id INT,
    IN p_officer_id INT,
    IN p_officer_name VARCHAR(255),
    IN p_officer_email VARCHAR(255),
    IN p_officer_phone VARCHAR(20),
    IN p_badge_number VARCHAR(50),
    IN p_rank VARCHAR(50),
    IN p_department_id INT,
    IN p_station_id INT,
    IN p_status ENUM('active', 'inactive'),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_old_values JSON;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Get current values for audit
    SELECT JSON_OBJECT(
        'officer_name', officer_name,
        'officer_email', officer_email,
        'officer_phone', officer_phone, 
        'badge_number', badge_number,
        'rank', rank,
        'status', status
    ) INTO v_old_values
    FROM Officers 
    WHERE officer_id = p_officer_id;
    
    -- Update officer
    UPDATE Officers SET 
        officer_name = p_officer_name,
        officer_email = p_officer_email,
        officer_phone = p_officer_phone,
        badge_number = p_badge_number,
        rank = p_rank,
        department_id = p_department_id,
        station_id = p_station_id,
        status = p_status,
        last_modified_by_admin_id = p_admin_id,
        last_modified_date = NOW()
    WHERE officer_id = p_officer_id;
    
    -- Log the action
    INSERT INTO Officer_Management_Log (
        admin_id, officer_id, action_type, notes,
        previous_values, new_values
    ) VALUES (
        p_admin_id, p_officer_id, 'updated', p_notes,
        v_old_values,
        JSON_OBJECT(
            'officer_name', p_officer_name,
            'officer_email', p_officer_email,
            'officer_phone', p_officer_phone,
            'badge_number', p_badge_number,
            'rank', p_rank,
            'status', p_status
        )
    );
    
    COMMIT;
END //

DELIMITER ;

-- Sample Triggers for Automatic Audit Trail
-- =========================================

-- Trigger to automatically log officer updates
DELIMITER //

CREATE TRIGGER tr_officers_after_update
AFTER UPDATE ON Officers
FOR EACH ROW
BEGIN
    IF NEW.last_modified_by_admin_id IS NOT NULL THEN
        INSERT INTO Officer_Management_Log (
            admin_id, officer_id, action_type,
            previous_values, new_values
        ) VALUES (
            NEW.last_modified_by_admin_id, NEW.officer_id, 'updated',
            JSON_OBJECT(
                'officer_name', OLD.officer_name,
                'status', OLD.status,
                'rank', OLD.rank
            ),
            JSON_OBJECT(
                'officer_name', NEW.officer_name,
                'status', NEW.status,
                'rank', NEW.rank
            )
        );
    END IF;
END //

DELIMITER ;

-- Verification Queries
-- ===================

-- Check current relationships
SELECT 'Current Officers without Admin relationship:' as info;
SELECT officer_id, officer_name, officer_email, 
       created_by_admin_id, created_date
FROM Officers 
WHERE created_by_admin_id IS NULL;

-- Check Admin-Officer relationship stats
SELECT 'Admin-Officer Relationship Statistics:' as info;
SELECT 
    COUNT(*) as total_officers,
    COUNT(created_by_admin_id) as officers_with_admin,
    COUNT(*) - COUNT(created_by_admin_id) as officers_without_admin,
    ROUND((COUNT(created_by_admin_id) / COUNT(*)) * 100, 2) as percentage_with_admin
FROM Officers;

-- Performance Analysis
-- ===================

-- Check index usage
SHOW INDEX FROM Officers;
SHOW INDEX FROM Officer_Management_Log;

-- Check foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN ('Officers', 'Officer_Management_Log', 'Departments', 'Stations')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Summary Report
-- ==============

SELECT '=== DATABASE ENHANCEMENT SUMMARY ===' as summary;
SELECT 'Enhanced Admin-Officer Relationship:' as feature, 'IMPLEMENTED' as status;
SELECT 'Officer Management Audit Trail:' as feature, 'IMPLEMENTED' as status;  
SELECT 'Department/Station Organization:' as feature, 'IMPLEMENTED' as status;
SELECT 'Management Views and Procedures:' as feature, 'IMPLEMENTED' as status;
SELECT 'Automatic Audit Triggers:' as feature, 'IMPLEMENTED' as status;

SELECT '=== NEXT STEPS ===' as next_steps;
SELECT '1. Update backend API to use new relationships' as step;
SELECT '2. Modify admin dashboard to show officer management' as step;
SELECT '3. Add audit trail viewing in admin interface' as step;
SELECT '4. Test all new stored procedures and triggers' as step;
SELECT '5. Update frontend to capture admin context' as step;
