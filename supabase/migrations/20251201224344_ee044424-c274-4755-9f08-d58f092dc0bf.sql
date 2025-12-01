-- Criar função SECURITY DEFINER para atualização de role por administradores
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  _target_user_id uuid,
  _new_role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user_id uuid;
BEGIN
  _current_user_id := auth.uid();
  
  -- Verificar se o usuário tem permissão para gerenciar usuários
  IF NOT has_effective_permission(_current_user_id, 'gerenciar_usuarios') THEN
    RAISE EXCEPTION 'Você não tem permissão para alterar roles de usuários';
  END IF;
  
  -- Atualizar na tabela profiles
  UPDATE profiles 
  SET role = _new_role, updated_at = now()
  WHERE id = _target_user_id;
  
  -- Atualizar na tabela user_roles (ou inserir se não existir)
  INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
  VALUES (_target_user_id, _new_role, _current_user_id, now())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    assigned_at = now(),
    assigned_by = _current_user_id;
    
  -- Remover outros roles do usuário (manter apenas o novo)
  DELETE FROM user_roles 
  WHERE user_id = _target_user_id AND role != _new_role;
END;
$$;