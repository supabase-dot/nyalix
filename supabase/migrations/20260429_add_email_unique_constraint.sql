-- Add unique constraint on email in profiles table to prevent duplicate registrations
-- First, delete any duplicate email records (keeping the oldest one)
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(email)) id
  FROM public.profiles
  WHERE email IS NOT NULL AND email != ''
  ORDER BY LOWER(email), created_at ASC
)
AND email IS NOT NULL AND email != '';

-- Create unique index on email (case-insensitive)
CREATE UNIQUE INDEX idx_profiles_email_unique ON public.profiles (LOWER(email));

-- Add comment explaining the index
COMMENT ON INDEX idx_profiles_email_unique 
IS 'Unique index ensures email addresses are unique (case-insensitive) to prevent duplicate user registrations';
