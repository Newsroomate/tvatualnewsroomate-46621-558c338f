-- Atualizar usuário hlemes144@gmail.com com triggers corrigidos
DO $$
DECLARE
  v_user_id uuid := 'b5e7bdc8-316f-4a69-8a60-8158847f1a0c';
BEGIN
  -- 1. Atualizar role para editor_chefe
  UPDATE profiles 
  SET role = 'editor_chefe'
  WHERE id = v_user_id;
  
  -- 2. Remover restrições de telejornal para acesso global
  DELETE FROM user_telejornal_access
  WHERE user_id = v_user_id;
  
  -- 3. Remover overrides negativos de permissões
  DELETE FROM user_permissions
  WHERE user_id = v_user_id AND is_granted = false;
  
  RAISE NOTICE 'Usuário hlemes144@gmail.com atualizado para editor_chefe com acesso global';
END $$;