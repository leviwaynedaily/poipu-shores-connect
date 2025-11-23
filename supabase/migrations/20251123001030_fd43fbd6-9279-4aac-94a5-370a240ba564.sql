-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Add folder column to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS folder text;

-- Add file_size and file_type columns for better management
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS file_type text;

-- Create index for faster folder queries
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder);

-- Update RLS policies for storage
CREATE POLICY "Anyone can view public documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Board and admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'board')
    )
  )
);

CREATE POLICY "Board and admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'board')
    )
  )
);