-- Fix security issue: Restrict access to blocos and telejornais to newsroom staff only
-- Currently these tables allow any authenticated user to view sensitive editorial information

-- Update blocos table policy to restrict to newsroom staff
DROP POLICY IF EXISTS "Authenticated users can view blocos" ON public.blocos;

CREATE POLICY "Newsroom staff can view blocos" 
ON public.blocos 
FOR SELECT 
USING (
  -- Only authenticated users with newsroom roles can view blocos
  auth.uid() IS NOT NULL AND 
  get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
);

-- Update telejornais table policy to restrict to newsroom staff  
DROP POLICY IF EXISTS "Authenticated users can view telejornais" ON public.telejornais;

CREATE POLICY "Newsroom staff can view telejornais" 
ON public.telejornais 
FOR SELECT 
USING (
  -- Only authenticated users with newsroom roles can view telejornais
  auth.uid() IS NOT NULL AND 
  get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
);

-- Ensure both tables have RLS properly enabled
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;