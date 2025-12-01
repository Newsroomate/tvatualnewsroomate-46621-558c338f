-- Solução para o erro de ambiguidade: Remover a função antiga e recriar todas as políticas
-- que dependem dela para usar a versão com 3 parâmetros

-- 1. Remover políticas que dependem da função antiga
DROP POLICY IF EXISTS "Users with permission can create blocos" ON blocos;
DROP POLICY IF EXISTS "Users with permission can update blocos" ON blocos;
DROP POLICY IF EXISTS "Users with permission can delete blocos" ON blocos;
DROP POLICY IF EXISTS "Users with permission can create materias" ON materias;
DROP POLICY IF EXISTS "Users with permission can update materias" ON materias;
DROP POLICY IF EXISTS "Users with permission can delete materias" ON materias;
DROP POLICY IF EXISTS "Users with permission can create telejornais" ON telejornais;
DROP POLICY IF EXISTS "Users with permission can update telejornais" ON telejornais;
DROP POLICY IF EXISTS "Users with permission can delete telejornais" ON telejornais;
DROP POLICY IF EXISTS "Users with permission can create pautas" ON pautas;
DROP POLICY IF EXISTS "Users with permission can update all pautas" ON pautas;
DROP POLICY IF EXISTS "Users with permission can delete all pautas" ON pautas;
DROP POLICY IF EXISTS "Users with permission can create models" ON modelos_salvos;
DROP POLICY IF EXISTS "Users with permission can update models" ON modelos_salvos;
DROP POLICY IF EXISTS "Users with permission can delete models" ON modelos_salvos;
DROP POLICY IF EXISTS "Users with permission can view all snapshots" ON materias_snapshots;
DROP POLICY IF EXISTS "Users with permission can update all snapshots" ON materias_snapshots;
DROP POLICY IF EXISTS "Users with permission can delete all snapshots" ON materias_snapshots;
DROP POLICY IF EXISTS "Editor chefe can view all backups" ON espelhos_backup;
DROP POLICY IF EXISTS "Editor chefe can create backups" ON espelhos_backup;
DROP POLICY IF EXISTS "Editor chefe can delete backups" ON espelhos_backup;

-- 2. Remover função antiga de 2 parâmetros
DROP FUNCTION IF EXISTS public.has_effective_permission(uuid, permission_type);

-- 3. Recriar políticas usando a função de 3 parâmetros (com telejornal_id quando aplicável)

-- BLOCOS
CREATE POLICY "Users with permission can create blocos" ON blocos
  FOR INSERT WITH CHECK (
    public.has_effective_permission(auth.uid(), 'criar_bloco'::permission_type, telejornal_id) 
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE POLICY "Users with permission can update blocos" ON blocos
  FOR UPDATE USING (
    public.has_effective_permission(auth.uid(), 'editar_bloco'::permission_type, telejornal_id) 
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE POLICY "Users with permission can delete blocos" ON blocos
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'excluir_bloco'::permission_type, telejornal_id) 
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

-- MATERIAS (precisa buscar telejornal_id via blocos)
CREATE POLICY "Users with permission can create materias" ON materias
  FOR INSERT WITH CHECK (
    public.has_effective_permission(auth.uid(), 'criar_materia'::permission_type) 
    AND EXISTS (
      SELECT 1 FROM blocos 
      WHERE blocos.id = materias.bloco_id 
      AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
    )
  );

CREATE POLICY "Users with permission can update materias" ON materias
  FOR UPDATE USING (
    public.has_effective_permission(auth.uid(), 'editar_materia'::permission_type) 
    AND EXISTS (
      SELECT 1 FROM blocos 
      WHERE blocos.id = materias.bloco_id 
      AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
    )
  );

CREATE POLICY "Users with permission can delete materias" ON materias
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'excluir_materia'::permission_type) 
    AND EXISTS (
      SELECT 1 FROM blocos 
      WHERE blocos.id = materias.bloco_id 
      AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
    )
  );

-- TELEJORNAIS
CREATE POLICY "Users with permission can create telejornais" ON telejornais
  FOR INSERT WITH CHECK (
    public.has_effective_permission(auth.uid(), 'criar_telejornal'::permission_type) 
    AND NOT EXISTS (SELECT 1 FROM user_telejornal_access WHERE user_id = auth.uid())
  );

CREATE POLICY "Users with permission can update telejornais" ON telejornais
  FOR UPDATE USING (
    public.has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type, id) 
    AND can_access_telejornal(auth.uid(), id)
  );

CREATE POLICY "Users with permission can delete telejornais" ON telejornais
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'excluir_telejornal'::permission_type, id) 
    AND can_access_telejornal(auth.uid(), id)
  );

-- PAUTAS (não tem telejornal_id)
CREATE POLICY "Users with permission can create pautas" ON pautas
  FOR INSERT WITH CHECK (
    public.has_effective_permission(auth.uid(), 'criar_pauta'::permission_type)
  );

CREATE POLICY "Users with permission can update all pautas" ON pautas
  FOR UPDATE USING (
    public.has_effective_permission(auth.uid(), 'editar_pauta'::permission_type) 
    OR auth.uid() = user_id
  );

CREATE POLICY "Users with permission can delete all pautas" ON pautas
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'excluir_pauta'::permission_type) 
    OR auth.uid() = user_id
  );

-- MODELOS SALVOS (não tem telejornal_id)
CREATE POLICY "Users with permission can create models" ON modelos_salvos
  FOR INSERT WITH CHECK (
    public.has_effective_permission(auth.uid(), 'salvar_modelo'::permission_type)
  );

CREATE POLICY "Users with permission can update models" ON modelos_salvos
  FOR UPDATE USING (
    public.has_effective_permission(auth.uid(), 'salvar_modelo'::permission_type)
  );

CREATE POLICY "Users with permission can delete models" ON modelos_salvos
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'excluir_modelo'::permission_type)
  );

-- MATERIAS SNAPSHOTS (não tem telejornal_id)
CREATE POLICY "Users with permission can view all snapshots" ON materias_snapshots
  FOR SELECT USING (
    public.has_effective_permission(auth.uid(), 'visualizar_snapshots'::permission_type) 
    OR auth.uid() = created_by
  );

CREATE POLICY "Users with permission can update all snapshots" ON materias_snapshots
  FOR UPDATE USING (
    public.has_effective_permission(auth.uid(), 'editar_snapshot'::permission_type) 
    OR auth.uid() = created_by
  );

CREATE POLICY "Users with permission can delete all snapshots" ON materias_snapshots
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'excluir_snapshots'::permission_type) 
    OR auth.uid() = created_by
  );

-- ESPELHOS BACKUP (não tem telejornal_id)
CREATE POLICY "Editor chefe can view all backups" ON espelhos_backup
  FOR SELECT USING (
    public.has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type)
  );

CREATE POLICY "Editor chefe can create backups" ON espelhos_backup
  FOR INSERT WITH CHECK (
    public.has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type)
  );

CREATE POLICY "Editor chefe can delete backups" ON espelhos_backup
  FOR DELETE USING (
    public.has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type)
  );