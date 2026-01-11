-- Add embedding_status column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending';

-- Add check constraint for valid status values
ALTER TABLE public.documents
ADD CONSTRAINT documents_embedding_status_check 
CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed'));

-- Create index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_documents_embedding_status 
ON public.documents(embedding_status);

-- Update existing documents that already have embeddings to 'completed'
UPDATE public.documents d
SET embedding_status = 'completed'
WHERE EXISTS (
  SELECT 1 FROM public.document_chunks dc WHERE dc.document_id = d.id
);

-- Update documents with content but no embeddings to 'pending'
UPDATE public.documents d
SET embedding_status = 'pending'
WHERE d.content IS NOT NULL 
  AND LENGTH(d.content) > 10
  AND NOT EXISTS (
    SELECT 1 FROM public.document_chunks dc WHERE dc.document_id = d.id
  );