-- Add country and sectors fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS sectors text[];

-- Create an index for sectors for better filtering performance
CREATE INDEX IF NOT EXISTS idx_profiles_sectors ON public.profiles USING GIN(sectors);