-- Add columns to support violations for unregistered citizens
-- Run this SQL on your database to enable the feature

ALTER TABLE Violations 
ADD COLUMN driving_license_number VARCHAR(50) NULL,
ADD COLUMN citizen_name VARCHAR(100) NULL;

-- Add index for faster lookup
CREATE INDEX idx_violations_license ON Violations(driving_license_number);

-- Update the existing violations query to handle both registered and unregistered users
-- This is handled in the backend code, no SQL changes needed
