
UPDATE profiles SET role = 'editor_chefe', updated_at = now() WHERE id = '57e0d305-9cea-409c-9f2c-d068d8ae8d13';

UPDATE user_roles SET role = 'editor_chefe', assigned_at = now() WHERE user_id = '57e0d305-9cea-409c-9f2c-d068d8ae8d13';
