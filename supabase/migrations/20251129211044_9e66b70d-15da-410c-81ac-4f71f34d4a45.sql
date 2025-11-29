-- Create enum for granular permissions
CREATE TYPE public.permission_type AS ENUM (
  'criar_materia',
  'editar_materia',
  'excluir_materia',
  'criar_bloco',
  'editar_bloco',
  'excluir_bloco',
  'criar_telejornal',
  'editar_telejornal',
  'excluir_telejornal',
  'gerenciar_espelho',
  'fechar_espelho',
  'criar_pauta',
  'editar_pauta',
  'excluir_pauta',
  'visualizar_todas_pautas',
  'gerenciar_usuarios',
  'gerenciar_permissoes',
  'visualizar_snapshots',
  'excluir_snapshots'
);

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission permission_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, permission)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission permission_type)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  )
$$;

-- Function to get all user permissions (for UI display)
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(permission TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT permission::TEXT
  FROM public.user_permissions
  WHERE user_id = _user_id
$$;

-- RLS policies for user_permissions table
CREATE POLICY "Editor chefe can view all permissions"
ON public.user_permissions
FOR SELECT
USING (
  has_role(auth.uid(), 'editor_chefe') OR 
  has_permission(auth.uid(), 'gerenciar_permissoes')
);

CREATE POLICY "Editor chefe can manage permissions"
ON public.user_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'editor_chefe') OR 
  has_permission(auth.uid(), 'gerenciar_permissoes')
);

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster permission lookups
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON public.user_permissions(permission);