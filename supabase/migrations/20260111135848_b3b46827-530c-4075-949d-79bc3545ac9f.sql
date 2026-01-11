-- Create table for storing OTP codes
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_otp_codes_phone_expires ON public.otp_codes(phone, expires_at);
CREATE INDEX idx_otp_codes_user_id ON public.otp_codes(user_id);

-- Enable RLS - only service role can access (no user policies)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Cleanup function for expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;