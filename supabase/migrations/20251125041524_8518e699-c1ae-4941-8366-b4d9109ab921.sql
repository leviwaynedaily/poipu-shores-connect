-- Create unit_owners relationship table
CREATE TABLE public.unit_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  relationship_type text NOT NULL DEFAULT 'primary',
  is_primary_contact boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure no duplicate user-unit combinations
  UNIQUE(user_id, unit_number)
);

-- Add indexes for faster lookups
CREATE INDEX idx_unit_owners_unit ON public.unit_owners(unit_number);
CREATE INDEX idx_unit_owners_user ON public.unit_owners(user_id);

-- Enable Row Level Security
ALTER TABLE public.unit_owners ENABLE ROW LEVEL SECURITY;

-- Anyone can view unit ownership information
CREATE POLICY "Anyone can view unit owners"
  ON public.unit_owners FOR SELECT
  TO authenticated
  USING (true);

-- Admins and owners can manage unit relationships
CREATE POLICY "Admins and owners can manage unit owners"
  ON public.unit_owners FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_unit_owners_updated_at
  BEFORE UPDATE ON public.unit_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing unit assignments from profiles to unit_owners
-- Set first person in each unit as primary contact
INSERT INTO public.unit_owners (user_id, unit_number, relationship_type, is_primary_contact)
SELECT 
  id, 
  unit_number, 
  'primary', 
  true
FROM public.profiles 
WHERE unit_number IS NOT NULL
ON CONFLICT (user_id, unit_number) DO NOTHING;