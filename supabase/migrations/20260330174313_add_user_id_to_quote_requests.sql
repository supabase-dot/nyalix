-- Add user_id column to quote_requests table
ALTER TABLE quote_requests ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);

-- Update RLS policies to allow users to see their own quotes
DROP POLICY IF EXISTS "Allow admin select" ON quote_requests;
DROP POLICY IF EXISTS "Allow admin update" ON quote_requests;
DROP POLICY IF EXISTS "Allow admin delete" ON quote_requests;

-- Policy: Users can view their own quotes
CREATE POLICY "Users can view own quotes" ON quote_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own quotes
CREATE POLICY "Users can insert own quotes" ON quote_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all quotes" ON quote_requests
  FOR ALL
  USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));