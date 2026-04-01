-- Fix RLS policies for quote_requests table to properly handle user queries
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own quotes" ON quote_requests;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quote_requests;
DROP POLICY IF EXISTS "Admins can manage all quotes" ON quote_requests;

-- Allow authenticated users to select if they are the owner
CREATE POLICY "users_select_own_quotes" ON quote_requests
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to insert their own quotes
CREATE POLICY "users_insert_own_quotes" ON quote_requests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow authenticated users to update their own quotes
CREATE POLICY "users_update_own_quotes" ON quote_requests
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all quotes
CREATE POLICY "admins_select_all_quotes" ON quote_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update all quotes
CREATE POLICY "admins_update_all_quotes" ON quote_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete all quotes
CREATE POLICY "admins_delete_all_quotes" ON quote_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
