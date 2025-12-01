-- Recreate has_effective_permission with optional telejornal_id (CREATE OR REPLACE allows adding optional params)
CREATE OR REPLACE FUNCTION public.has_effective_permission(
  _user_id uuid, 
  _permission permission_type,
  _telejornal_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_role user_role;
  _is_granted boolean;
  _telejornal_role user_role;
BEGIN
  -- Check for explicit permission override in user_permissions
  SELECT is_granted INTO _is_granted
  FROM user_permissions 
  WHERE user_id = _user_id AND permission = _permission;
  
  -- If there's an explicit override, use it
  IF _is_granted IS NOT NULL THEN
    RETURN _is_granted;
  END IF;
  
  -- If telejornal_id provided, check for telejornal-specific role exception
  IF _telejornal_id IS NOT NULL THEN
    SELECT role INTO _telejornal_role
    FROM user_telejornal_access
    WHERE user_id = _user_id AND telejornal_id = _telejornal_id;
    
    -- If telejornal exception exists, use that role instead of global role
    IF _telejornal_role IS NOT NULL THEN
      _user_role := _telejornal_role;
    ELSE
      -- Fall back to global role
      SELECT role INTO _user_role 
      FROM profiles 
      WHERE id = _user_id 
      LIMIT 1;
    END IF;
  ELSE
    -- No telejornal context, use global role
    SELECT role INTO _user_role 
    FROM profiles 
    WHERE id = _user_id 
    LIMIT 1;
  END IF;
  
  -- Check role-based permissions matrix
  RETURN CASE _user_role
    WHEN 'editor_chefe' THEN true
    WHEN 'editor' THEN _permission IN (
      'criar_materia', 'editar_materia', 'excluir_materia', 
      'duplicar_materia', 'copiar_materia', 'colar_materia', 'reordenar_materias', 'transferir_materias',
      'criar_bloco', 'editar_bloco', 'excluir_bloco', 
      'copiar_bloco', 'colar_bloco', 'renomear_bloco',
      'criar_telejornal', 'editar_telejornal',
      'gerenciar_espelho', 'abrir_espelho', 'fechar_espelho',
      'salvar_modelo', 'aplicar_modelo', 'visualizar_modelos',
      'exportar_gc', 'exportar_playout', 'exportar_lauda', 'exportar_clip_retranca', 'exportar_rss',
      'visualizar_teleprompter', 'visualizar_laudas', 'busca_profunda', 'visualizar_historico_espelhos',
      'salvar_espelho', 'editar_espelho_salvo', 'criar_snapshot', 'editar_snapshot', 'visualizar_snapshots'
    )
    WHEN 'reporter' THEN _permission IN (
      'criar_materia', 'editar_materia',
      'duplicar_materia', 'copiar_materia', 'colar_materia',
      'visualizar_teleprompter', 'visualizar_laudas', 'busca_profunda',
      'exportar_lauda', 'exportar_clip_retranca',
      'visualizar_historico_espelhos', 'visualizar_snapshots'
    )
    WHEN 'produtor' THEN _permission IN (
      'criar_pauta', 'editar_pauta', 'excluir_pauta', 'visualizar_todas_pautas',
      'busca_profunda', 'visualizar_historico_espelhos'
    )
    ELSE false
  END;
END;
$$;

-- Update RLS policies on espelhos_salvos to pass telejornal_id to has_effective_permission
DROP POLICY IF EXISTS "Users with permission can delete saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Users with permission can update saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Users can create saved rundowns for accessible telejornais" ON public.espelhos_salvos;

CREATE POLICY "Users with permission can delete saved rundowns"
ON public.espelhos_salvos
FOR DELETE
USING (
  (has_effective_permission(auth.uid(), 'excluir_espelho_salvo'::permission_type, telejornal_id) 
   OR (auth.uid() = user_id)) 
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users with permission can update saved rundowns"
ON public.espelhos_salvos
FOR UPDATE
USING (
  (has_effective_permission(auth.uid(), 'editar_espelho_salvo'::permission_type, telejornal_id) 
   OR (auth.uid() = user_id)) 
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users can create saved rundowns for accessible telejornais"
ON public.espelhos_salvos
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) 
  AND can_access_telejornal(auth.uid(), telejornal_id)
  AND has_effective_permission(auth.uid(), 'salvar_espelho'::permission_type, telejornal_id)
);