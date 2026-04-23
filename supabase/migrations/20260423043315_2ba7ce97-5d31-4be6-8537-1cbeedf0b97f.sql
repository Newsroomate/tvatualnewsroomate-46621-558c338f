
UPDATE public.profiles
SET role = 'editor_chefe', updated_at = now()
WHERE id = '5a7496e0-2471-4204-b6b5-1a65be566ee6';

DELETE FROM public.user_roles
WHERE user_id = '5a7496e0-2471-4204-b6b5-1a65be566ee6'
  AND role <> 'editor_chefe';

INSERT INTO public.user_roles (user_id, role, assigned_at)
VALUES ('5a7496e0-2471-4204-b6b5-1a65be566ee6', 'editor_chefe', now())
ON CONFLICT (user_id, role) DO UPDATE SET assigned_at = now();
