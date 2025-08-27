-- Fix security issue: Ensure materias table has proper RLS enabled and policies
-- First, ensure RLS is enabled on the materias table
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

-- Remove any potentially overly permissive policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.materias;
DROP POLICY IF EXISTS "Public read access" ON public.materias;

-- Ensure the existing policy for newsroom staff is properly restrictive
-- This policy should already exist but let's recreate it to be sure
DROP POLICY IF EXISTS "Newsroom staff can view all materias" ON public.materias;

CREATE POLICY "Newsroom staff can view all materias" 
ON public.materias 
FOR SELECT 
USING (
  -- Only authenticated users with newsroom roles can view materias
  auth.uid() IS NOT NULL AND 
  get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
);

-- Ensure all other existing policies remain intact and properly restrictive
-- Verify reporters and above can create materias (should already exist)
DROP POLICY IF EXISTS "Reporters and above can create materias" ON public.materias;
CREATE POLICY "Reporters and above can create materias" 
ON public.materias 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])
);

-- Verify reporters and above can update materias (should already exist)  
DROP POLICY IF EXISTS "Reporters and above can update materias" ON public.materias;
CREATE POLICY "Reporters and above can update materias" 
ON public.materias 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND
  get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])
);

-- Verify editor chefe can delete materias (should already exist)
DROP POLICY IF EXISTS "Editor chefe can delete materias" ON public.materias;
CREATE POLICY "Editor chefe can delete materias" 
ON public.materias 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND
  get_current_user_role() = 'editor_chefe'::text
);