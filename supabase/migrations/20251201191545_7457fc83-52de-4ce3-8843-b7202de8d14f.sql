-- Corrigir o trigger log_role_change() para funcionar com a tabela profiles
-- A tabela profiles usa 'id' não 'user_id'

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Detectar qual tabela está sendo atualizada
  IF TG_TABLE_NAME = 'profiles' THEN
    v_user_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'user_roles' THEN
    v_user_id := NEW.user_id;
  ELSE
    v_user_id := NEW.id; -- fallback
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      old_role,
      new_role,
      details
    ) VALUES (
      COALESCE(auth.uid(), v_user_id), -- Se não houver auth.uid, usar o próprio usuário
      'update_role',
      v_user_id,
      OLD.role,
      NEW.role,
      jsonb_build_object('old_role', OLD.role::text, 'new_role', NEW.role::text, 'table', TG_TABLE_NAME)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe na tabela profiles
DROP TRIGGER IF EXISTS log_profile_role_change ON profiles;

CREATE TRIGGER log_profile_role_change
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION log_role_change();