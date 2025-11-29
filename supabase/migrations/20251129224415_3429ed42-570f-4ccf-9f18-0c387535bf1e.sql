-- Create function to check effective permissions (granular + role-based)
CREATE OR REPLACE FUNCTION public.has_effective_permission(_user_id uuid, _permission permission_type)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role user_role;
  _is_granted boolean;
BEGIN
  -- Get user's role
  SELECT role INTO _user_role 
  FROM profiles 
  WHERE id = _user_id 
  LIMIT 1;
  
  -- Check for explicit permission override in user_permissions
  SELECT is_granted INTO _is_granted
  FROM user_permissions 
  WHERE user_id = _user_id AND permission = _permission;
  
  -- If there's an explicit override, use it
  IF _is_granted IS NOT NULL THEN
    RETURN _is_granted;
  END IF;
  
  -- Otherwise, check role-based permissions matrix
  RETURN CASE _user_role
    -- EDITOR_CHEFE: All permissions
    WHEN 'editor_chefe' THEN true
    
    -- EDITOR: Most permissions except user management
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
    
    -- REPORTER: Matéria operations, views, and basic exports
    WHEN 'reporter' THEN _permission IN (
      'criar_materia', 'editar_materia',
      'duplicar_materia', 'copiar_materia', 'colar_materia',
      'visualizar_teleprompter', 'visualizar_laudas', 'busca_profunda',
      'exportar_lauda', 'exportar_clip_retranca',
      'visualizar_historico_espelhos', 'visualizar_snapshots'
    )
    
    -- PRODUTOR: Pauta management and some views
    WHEN 'produtor' THEN _permission IN (
      'criar_pauta', 'editar_pauta', 'excluir_pauta', 'visualizar_todas_pautas',
      'busca_profunda', 'visualizar_historico_espelhos'
    )
    
    ELSE false
  END;
END;
$$;

-- ==========================================
-- UPDATE BLOCOS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Editors can create blocos in accessible telejornais" ON blocos;
DROP POLICY IF EXISTS "Editors can update blocos of accessible telejornais" ON blocos;
DROP POLICY IF EXISTS "Editor chefe can delete blocos in accessible telejornais" ON blocos;

CREATE POLICY "Users with permission can create blocos"
ON blocos FOR INSERT
TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'criar_bloco')
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users with permission can update blocos"
ON blocos FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_bloco')
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users with permission can delete blocos"
ON blocos FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'excluir_bloco')
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- ==========================================
-- UPDATE MATERIAS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Reporters and above can create materias in accessible telejorna" ON materias;
DROP POLICY IF EXISTS "Reporters and above can update materias in accessible telejorna" ON materias;
DROP POLICY IF EXISTS "Editor chefe can delete materias in accessible telejornais" ON materias;

CREATE POLICY "Users with permission can create materias"
ON materias FOR INSERT
TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'criar_materia')
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

CREATE POLICY "Users with permission can update materias"
ON materias FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_materia')
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

CREATE POLICY "Users with permission can delete materias"
ON materias FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'excluir_materia')
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

-- ==========================================
-- UPDATE TELEJORNAIS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Editors can create telejornais" ON telejornais;
DROP POLICY IF EXISTS "Editors can update accessible telejornais" ON telejornais;
DROP POLICY IF EXISTS "Editor chefe can delete accessible telejornais" ON telejornais;

CREATE POLICY "Users with permission can create telejornais"
ON telejornais FOR INSERT
TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'criar_telejornal')
  AND NOT EXISTS (
    SELECT 1 FROM user_telejornal_access 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users with permission can update telejornais"
ON telejornais FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_telejornal')
  AND can_access_telejornal(auth.uid(), id)
);

CREATE POLICY "Users with permission can delete telejornais"
ON telejornais FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'excluir_telejornal')
  AND can_access_telejornal(auth.uid(), id)
);

-- ==========================================
-- UPDATE PAUTAS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Producers and editor-chefe can create pautas" ON pautas;
DROP POLICY IF EXISTS "Editor-chefe can update all pautas" ON pautas;
DROP POLICY IF EXISTS "Editor-chefe can delete all pautas" ON pautas;

-- Keep user-owned policies, add permission-based policies
CREATE POLICY "Users with permission can create pautas"
ON pautas FOR INSERT
TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'criar_pauta')
);

CREATE POLICY "Users with permission can update all pautas"
ON pautas FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_pauta')
  OR auth.uid() = user_id
);

CREATE POLICY "Users with permission can delete all pautas"
ON pautas FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'excluir_pauta')
  OR auth.uid() = user_id
);

-- ==========================================
-- UPDATE ESPELHOS_SALVOS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Editor chefe can update saved rundowns in accessible telejornai" ON espelhos_salvos;
DROP POLICY IF EXISTS "Editor chefe can delete saved rundowns in accessible telejornai" ON espelhos_salvos;

CREATE POLICY "Users with permission can update saved rundowns"
ON espelhos_salvos FOR UPDATE
TO authenticated
USING (
  (has_effective_permission(auth.uid(), 'editar_espelho_salvo') OR auth.uid() = user_id)
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users with permission can delete saved rundowns"
ON espelhos_salvos FOR DELETE
TO authenticated
USING (
  (has_effective_permission(auth.uid(), 'excluir_espelho_salvo') OR auth.uid() = user_id)
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- ==========================================
-- UPDATE MODELOS_SALVOS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Editors can create saved models" ON modelos_salvos;
DROP POLICY IF EXISTS "Editors can update saved models" ON modelos_salvos;
DROP POLICY IF EXISTS "Editor chefe can delete saved models" ON modelos_salvos;

CREATE POLICY "Users with permission can create models"
ON modelos_salvos FOR INSERT
TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'salvar_modelo')
);

CREATE POLICY "Users with permission can update models"
ON modelos_salvos FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'salvar_modelo')
);

CREATE POLICY "Users with permission can delete models"
ON modelos_salvos FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'excluir_modelo')
);

-- ==========================================
-- UPDATE MATERIAS_SNAPSHOTS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Editors can update all snapshots" ON materias_snapshots;
DROP POLICY IF EXISTS "Editors can view all snapshots" ON materias_snapshots;
DROP POLICY IF EXISTS "Editor chefe can delete all snapshots" ON materias_snapshots;

CREATE POLICY "Users with permission can view all snapshots"
ON materias_snapshots FOR SELECT
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'visualizar_snapshots')
  OR auth.uid() = created_by
);

CREATE POLICY "Users with permission can update all snapshots"
ON materias_snapshots FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_snapshot')
  OR auth.uid() = created_by
);

CREATE POLICY "Users with permission can delete all snapshots"
ON materias_snapshots FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'excluir_snapshots')
  OR auth.uid() = created_by
);