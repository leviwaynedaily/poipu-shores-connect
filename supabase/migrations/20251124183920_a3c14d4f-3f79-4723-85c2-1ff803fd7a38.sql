-- Update RLS policies to use owner role instead of board role

-- Update announcements policies
DROP POLICY IF EXISTS "Board and admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Board and admins can update announcements" ON announcements;

CREATE POLICY "Admins and owners can create announcements" 
ON announcements 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update announcements" 
ON announcements 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update chat_channels policies
DROP POLICY IF EXISTS "Admins can create channels" ON chat_channels;
DROP POLICY IF EXISTS "Admins can update channels" ON chat_channels;
DROP POLICY IF EXISTS "Everyone can view public channels" ON chat_channels;

CREATE POLICY "Admins and owners can create channels" 
ON chat_channels 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update channels" 
ON chat_channels 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Everyone can view public channels updated" 
ON chat_channels 
FOR SELECT 
USING ((NOT is_private) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update chat_messages policies
DROP POLICY IF EXISTS "Moderators can delete messages" ON chat_messages;

CREATE POLICY "Admins and owners can delete messages" 
ON chat_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update community_photos policies
DROP POLICY IF EXISTS "Admins can manage all photos" ON community_photos;

CREATE POLICY "Admins and owners can manage all photos" 
ON community_photos 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update documents policies
DROP POLICY IF EXISTS "Board and admins can update documents" ON documents;
DROP POLICY IF EXISTS "Board and admins can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;

CREATE POLICY "Admins and owners can update documents" 
ON documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can upload documents" 
ON documents 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can view shared documents updated" 
ON documents 
FOR SELECT 
USING ((unit_number IS NULL) OR (unit_number = (SELECT profiles.unit_number FROM profiles WHERE profiles.id = auth.uid())) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update emergency_contacts policies
DROP POLICY IF EXISTS "Admins and board can manage emergency contacts" ON emergency_contacts;

CREATE POLICY "Admins and owners can manage emergency contacts" 
ON emergency_contacts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update folders policies
DROP POLICY IF EXISTS "Board and admins can create folders" ON folders;
DROP POLICY IF EXISTS "Board and admins can update folders" ON folders;

CREATE POLICY "Admins and owners can create folders" 
ON folders 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins and owners can update folders" 
ON folders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Update webcams policies
DROP POLICY IF EXISTS "Admins and board can manage webcams" ON webcams;

CREATE POLICY "Admins and owners can manage webcams" 
ON webcams 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));