-- Add status column to Payments table if it doesn't exist
ALTER TABLE Payments 
ADD COLUMN IF NOT EXISTS status ENUM('Pending', 'Confirmed') DEFAULT 'Pending';

-- Update existing payments to have a default status
UPDATE Payments SET status = 'Pending' WHERE status IS NULL;
