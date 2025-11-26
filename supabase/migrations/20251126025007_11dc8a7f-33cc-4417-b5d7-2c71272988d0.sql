-- Create pending_invites table for custom invitation flow
CREATE TABLE IF NOT EXISTS public.pending_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  unit_number text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

-- Service role only access (edge functions only)
CREATE POLICY "Service role only" ON public.pending_invites
  FOR ALL USING (false);

-- Add index on token for fast lookups
CREATE INDEX idx_pending_invites_token ON public.pending_invites(token);
CREATE INDEX idx_pending_invites_user_id ON public.pending_invites(user_id);
CREATE INDEX idx_pending_invites_expires_at ON public.pending_invites(expires_at);