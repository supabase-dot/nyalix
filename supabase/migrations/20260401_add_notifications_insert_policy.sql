-- Add INSERT policy for notifications table to allow Edge Function to log notifications
-- The Edge Function uses service_role_key within Supabase system, so we allow authenticated inserts
CREATE POLICY "Service role and authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Optional: Add UPDATE policy for Edge Function to update notification status if needed
CREATE POLICY "Service role can update notifications" ON public.notifications
  FOR UPDATE USING (true) WITH CHECK (true);
