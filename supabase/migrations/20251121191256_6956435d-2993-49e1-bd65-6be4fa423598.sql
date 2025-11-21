-- Atualizar role do usuário laraleaorv@hotmail.com para editor_chefe
UPDATE public.user_roles 
SET role = 'editor_chefe'
WHERE user_id = 'eafc7e6c-8d23-496b-887e-c5aa3c9c7deb';