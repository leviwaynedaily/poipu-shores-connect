-- Add admin role for leviwayendaily@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('01f1fd40-26be-4a87-b347-461a6bb1cccd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;