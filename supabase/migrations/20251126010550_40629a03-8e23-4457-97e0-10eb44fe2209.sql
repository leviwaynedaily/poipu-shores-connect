-- Add deactivation tracking columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN deactivated_at TIMESTAMPTZ,
  ADD COLUMN deactivation_reason TEXT;

-- Add index for better query performance on active users
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active. False means archived/deactivated.';
COMMENT ON COLUMN public.profiles.deactivated_at IS 'Timestamp when the user was deactivated';
COMMENT ON COLUMN public.profiles.deactivation_reason IS 'Reason for deactivation (e.g., sold unit, no longer owner)';