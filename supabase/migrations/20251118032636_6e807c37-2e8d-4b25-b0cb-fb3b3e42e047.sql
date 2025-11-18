-- Fix 1: Create secure user_roles table to prevent privilege escalation
-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'editor_chefe'
));

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Create secure role-checking function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update get_current_user_role to use user_roles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role::TEXT, 'reporter') 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Fix 2: Add search_path to SECURITY DEFINER functions

-- Fix cleanup_expired_locks
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

-- Fix enable_realtime with input validation
CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate table name exists in public schema
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = table_name
  ) THEN
    RAISE EXCEPTION 'Table % does not exist in public schema', table_name;
  END IF;
  
  -- Enable replica identity for the table
  EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
  
  -- Add table to realtime publication
  EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to enable realtime for table %: %', table_name, SQLERRM;
    RETURN false;
END;
$$;

-- Fix handle_new_user to assign roles in user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default role in user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter');
  
  RETURN NEW;
END;
$$;