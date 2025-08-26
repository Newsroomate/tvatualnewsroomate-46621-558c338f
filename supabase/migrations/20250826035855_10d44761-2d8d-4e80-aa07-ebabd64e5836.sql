-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view materias" ON public.materias;

-- Create more secure, role-based policies for viewing materias
CREATE POLICY "Newsroom staff can view all materias"
ON public.materias
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
);

-- Optional: If you need a policy for published content to be viewable by others
-- (uncomment if needed for external integrations or broader access to published content)
-- CREATE POLICY "Published materias are viewable by authenticated users"
-- ON public.materias
-- FOR SELECT
-- USING (
--   status = 'published' AND auth.uid() IS NOT NULL
-- );