
-- Phase 1: Critical RLS Policy Fixes

-- 1. Secure espelhos_salvos table - Add user ownership
ALTER TABLE public.espelhos_salvos 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing records to assign ownership to the first admin user
UPDATE public.espelhos_salvos 
SET user_id = (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.role = 'editor_chefe' 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can delete saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can update saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can view saved rundowns" ON public.espelhos_salvos;

-- Create secure ownership-based policies for espelhos_salvos
CREATE POLICY "Users can view their own saved rundowns" 
ON public.espelhos_salvos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can view all saved rundowns" 
ON public.espelhos_salvos 
FOR SELECT 
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can create their own saved rundowns" 
ON public.espelhos_salvos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved rundowns" 
ON public.espelhos_salvos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can update all saved rundowns" 
ON public.espelhos_salvos 
FOR UPDATE 
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can delete their own saved rundowns" 
ON public.espelhos_salvos 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can delete all saved rundowns" 
ON public.espelhos_salvos 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- 2. Secure materias_snapshots table - Add creator ownership
ALTER TABLE public.materias_snapshots 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing snapshots to assign ownership
UPDATE public.materias_snapshots 
SET created_by = (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.role = 'editor_chefe' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can modify snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can view snapshots" ON public.materias_snapshots;

-- Create secure ownership-based policies for materias_snapshots
CREATE POLICY "Users can view their own snapshots" 
ON public.materias_snapshots 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Editors can view all snapshots" 
ON public.materias_snapshots 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Users can create snapshots" 
ON public.materias_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own snapshots" 
ON public.materias_snapshots 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Editors can update all snapshots" 
ON public.materias_snapshots 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Users can delete their own snapshots" 
ON public.materias_snapshots 
FOR DELETE 
USING (auth.uid() = created_by);

CREATE POLICY "Editor chefe can delete all snapshots" 
ON public.materias_snapshots 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- 3. Harden database functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role::TEXT, 'reporter') 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'reporter'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
