-- Add payment_submitted column to Violations table to track when user submits payment receipt
ALTER TABLE Violations 
ADD COLUMN IF NOT EXISTS payment_submitted BOOLEAN DEFAULT FALSE;

-- Update existing violations that have payments to mark as submitted
UPDATE Violations v
SET payment_submitted = TRUE
WHERE v.violation_id IN (SELECT DISTINCT violation_id FROM Payments);
