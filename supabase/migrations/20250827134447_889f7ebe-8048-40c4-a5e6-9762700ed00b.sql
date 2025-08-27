-- Fix security issue: Remove overly permissive policy that allows all users to see all pautas
-- This policy currently allows any authenticated user to view all pautas, exposing user IDs and personal info
DROP POLICY IF EXISTS "Authenticated users can view pautas" ON public.pautas;

-- Add policy for editors to view all pautas (following the same pattern as other tables)
-- This ensures editors can still manage pautas while restricting regular users to their own
CREATE POLICY "Editors can view all pautas" 
ON public.pautas 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

-- The existing "Users can view their own pautas" policy remains unchanged
-- This ensures users can only see pautas they created (where auth.uid() = user_id)