-- Add content column to documents table for storing extracted text
ALTER TABLE documents ADD COLUMN content TEXT;

-- Add index for faster content searches
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('english', content));

-- Add comment to explain the column
COMMENT ON COLUMN documents.content IS 'Extracted text content from the document for AI search and analysis';