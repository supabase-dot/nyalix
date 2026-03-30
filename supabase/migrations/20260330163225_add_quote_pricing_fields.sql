-- Add pricing fields to quote_requests table
ALTER TABLE quote_requests
ADD COLUMN unit_price DECIMAL(10,2),
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.08,
ADD COLUMN tax_amount DECIMAL(10,2),
ADD COLUMN total_amount DECIMAL(10,2);

-- Update existing records with default pricing (this would be set by admin when approving)
UPDATE quote_requests
SET
  unit_price = 100.00,
  tax_amount = 100.00 * quantity * 0.08,
  total_amount = 100.00 * quantity * 1.08
WHERE unit_price IS NULL;