-- Create folders table with hierarchical structure
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT folder_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Enable Row Level Security
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Everyone can view folders"
ON public.folders
FOR SELECT
USING (true);

CREATE POLICY "Board and admins can create folders"
ON public.folders
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'board'));

CREATE POLICY "Board and admins can update folders"
ON public.folders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'board'));

CREATE POLICY "Admins can delete folders"
ON public.folders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add folder_id to documents table
ALTER TABLE public.documents
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create trigger for automatic timestamp updates on folders
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_folders_parent_folder_id ON public.folders(parent_folder_id);
CREATE INDEX idx_documents_folder_id ON public.documents(folder_id);