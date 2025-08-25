-- Fix security issue: Restrict access to modelos_salvos table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view saved models" ON public.modelos_salvos;
DROP POLICY IF EXISTS "Anyone can create saved models" ON public.modelos_salvos;  
DROP POLICY IF EXISTS "Anyone can update saved models" ON public.modelos_salvos;
DROP POLICY IF EXISTS "Anyone can delete saved models" ON public.modelos_salvos;

-- Create secure policies that require authentication and proper roles
-- All authenticated users can view saved models (templates are shared resources)
CREATE POLICY "Authenticated users can view saved models" 
ON public.modelos_salvos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only editors and editor-chefe can create saved models
CREATE POLICY "Editors can create saved models" 
ON public.modelos_salvos 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

-- Only editors and editor-chefe can update saved models  
CREATE POLICY "Editors can update saved models" 
ON public.modelos_salvos 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

-- Only editor-chefe can delete saved models (more restrictive)
CREATE POLICY "Editor chefe can delete saved models" 
ON public.modelos_salvos 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe'::text);