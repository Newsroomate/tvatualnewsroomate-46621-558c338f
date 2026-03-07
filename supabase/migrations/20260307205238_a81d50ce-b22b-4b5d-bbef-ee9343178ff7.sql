
-- One-time data update: promote user to editor_chefe
-- Update profiles table
UPDATE profiles SET role = 'editor_chefe', updated_at = now() WHERE id = '512511d0-ff42-4caf-89c6-bf5a9974895c';

-- Remove existing roles
DELETE FROM user_roles WHERE user_id = '512511d0-ff42-4caf-89c6-bf5a9974895c';

-- Insert new editor_chefe role
INSERT INTO user_roles (user_id, role, assigned_at) VALUES ('512511d0-ff42-4caf-89c6-bf5a9974895c', 'editor_chefe', now());
