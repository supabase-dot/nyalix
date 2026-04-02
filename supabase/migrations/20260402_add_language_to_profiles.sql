-- Add language field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language TEXT DEFAULT 'en' NOT NULL;

-- Add check constraint to ensure only valid language codes
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_language CHECK (language IN ('en', 'ar'));
