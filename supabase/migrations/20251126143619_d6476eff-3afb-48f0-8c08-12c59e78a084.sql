-- Create photo_likes table
CREATE TABLE public.photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.community_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable RLS on photo_likes
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_likes
CREATE POLICY "Anyone can view likes"
  ON public.photo_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own likes"
  ON public.photo_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON public.photo_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create photo_comments table
CREATE TABLE public.photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.community_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on photo_comments
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_comments
CREATE POLICY "Anyone can view comments"
  ON public.photo_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own comments"
  ON public.photo_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.photo_comments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can delete any comment"
  ON public.photo_comments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes(photo_id);
CREATE INDEX idx_photo_likes_user_id ON public.photo_likes(user_id);
CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments(photo_id);
CREATE INDEX idx_photo_comments_user_id ON public.photo_comments(user_id);