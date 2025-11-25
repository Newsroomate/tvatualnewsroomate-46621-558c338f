-- Função auxiliar para verificar se usuário pode acessar um telejornal específico
-- Se usuário não tem exceções, pode acessar todos os telejornais
-- Se usuário tem exceções, pode acessar apenas os telejornais nas exceções
CREATE OR REPLACE FUNCTION public.can_access_telejornal(_user_id uuid, _telejornal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Se não há nenhuma exceção para o usuário, retorna true (acesso a todos)
      WHEN NOT EXISTS (SELECT 1 FROM user_telejornal_access WHERE user_id = _user_id) THEN true
      -- Se há exceções, verifica se o telejornal está nas exceções
      ELSE EXISTS (SELECT 1 FROM user_telejornal_access WHERE user_id = _user_id AND telejornal_id = _telejornal_id)
    END;
$$;

-- ========================================
-- POLICIES PARA TELEJORNAIS
-- ========================================

-- Recriar policy de SELECT para telejornais
DROP POLICY IF EXISTS "Newsroom staff can view telejornais" ON public.telejornais;

CREATE POLICY "Users can view accessible telejornais"
ON public.telejornais
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
  AND can_access_telejornal(auth.uid(), id)
);

-- Recriar policy de UPDATE para telejornais
DROP POLICY IF EXISTS "Editors can update telejornais" ON public.telejornais;

CREATE POLICY "Editors can update accessible telejornais"
ON public.telejornais
FOR UPDATE
TO authenticated
USING (
  get_effective_telejornal_role(auth.uid(), id) = ANY (ARRAY['editor'::text, 'editor_chefe'::text])
  AND can_access_telejornal(auth.uid(), id)
);

-- Recriar policy de INSERT para telejornais (apenas se não tiver exceções ou for editor_chefe global)
DROP POLICY IF EXISTS "Editors can create telejornais" ON public.telejornais;

CREATE POLICY "Editors can create telejornais"
ON public.telejornais
FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text])
  AND NOT EXISTS (SELECT 1 FROM user_telejornal_access WHERE user_id = auth.uid())
);

-- Recriar policy de DELETE para telejornais
DROP POLICY IF EXISTS "Editor chefe can delete telejornais" ON public.telejornais;

CREATE POLICY "Editor chefe can delete accessible telejornais"
ON public.telejornais
FOR DELETE
TO authenticated
USING (
  get_current_user_role() = 'editor_chefe'::text
  AND can_access_telejornal(auth.uid(), id)
);

-- ========================================
-- POLICIES PARA BLOCOS
-- ========================================

-- Recriar policy de SELECT para blocos
DROP POLICY IF EXISTS "Newsroom staff can view blocos" ON public.blocos;

CREATE POLICY "Users can view blocos of accessible telejornais"
ON public.blocos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- Recriar policy de UPDATE para blocos
DROP POLICY IF EXISTS "Editors can update blocos" ON public.blocos;

CREATE POLICY "Editors can update blocos of accessible telejornais"
ON public.blocos
FOR UPDATE
TO authenticated
USING (
  get_effective_telejornal_role(auth.uid(), telejornal_id) = ANY (ARRAY['editor'::text, 'editor_chefe'::text])
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- Recriar policy de INSERT para blocos
DROP POLICY IF EXISTS "Editors can create blocos" ON public.blocos;

CREATE POLICY "Editors can create blocos in accessible telejornais"
ON public.blocos
FOR INSERT
TO authenticated
WITH CHECK (
  get_effective_telejornal_role(auth.uid(), telejornal_id) = ANY (ARRAY['editor'::text, 'editor_chefe'::text])
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- Recriar policy de DELETE para blocos
DROP POLICY IF EXISTS "Editor chefe can delete blocos" ON public.blocos;

CREATE POLICY "Editor chefe can delete blocos in accessible telejornais"
ON public.blocos
FOR DELETE
TO authenticated
USING (
  get_effective_telejornal_role(auth.uid(), telejornal_id) = 'editor_chefe'::text
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- ========================================
-- POLICIES PARA MATERIAS
-- ========================================

-- Recriar policy de SELECT para materias
DROP POLICY IF EXISTS "Newsroom staff can view all materias" ON public.materias;

CREATE POLICY "Users can view materias of accessible telejornais"
ON public.materias
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

-- Recriar policy de UPDATE para materias
DROP POLICY IF EXISTS "Reporters and above can update materias" ON public.materias;

CREATE POLICY "Reporters and above can update materias in accessible telejornais"
ON public.materias
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

-- Recriar policy de INSERT para materias
DROP POLICY IF EXISTS "Reporters and above can create materias" ON public.materias;

CREATE POLICY "Reporters and above can create materias in accessible telejornais"
ON public.materias
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

-- Recriar policy de DELETE para materias
DROP POLICY IF EXISTS "Editor chefe can delete materias" ON public.materias;

CREATE POLICY "Editor chefe can delete materias in accessible telejornais"
ON public.materias
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND get_current_user_role() = 'editor_chefe'::text
  AND EXISTS (
    SELECT 1 FROM blocos 
    WHERE blocos.id = materias.bloco_id 
    AND can_access_telejornal(auth.uid(), blocos.telejornal_id)
  )
);

-- ========================================
-- POLICIES PARA ESPELHOS_SALVOS
-- ========================================

-- Recriar policy de SELECT para espelhos_salvos
DROP POLICY IF EXISTS "All authenticated users can view all saved rundowns" ON public.espelhos_salvos;

CREATE POLICY "Users can view saved rundowns of accessible telejornais"
ON public.espelhos_salvos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- Recriar policy de INSERT para espelhos_salvos
DROP POLICY IF EXISTS "Users can create their own saved rundowns" ON public.espelhos_salvos;

CREATE POLICY "Users can create saved rundowns for accessible telejornais"
ON public.espelhos_salvos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- Recriar policies de UPDATE para espelhos_salvos
DROP POLICY IF EXISTS "Users can update their own saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Editor chefe can update all saved rundowns" ON public.espelhos_salvos;

CREATE POLICY "Users can update their own saved rundowns in accessible telejornais"
ON public.espelhos_salvos
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Editor chefe can update saved rundowns in accessible telejornais"
ON public.espelhos_salvos
FOR UPDATE
TO authenticated
USING (
  get_current_user_role() = 'editor_chefe'::text
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- Recriar policies de DELETE para espelhos_salvos
DROP POLICY IF EXISTS "Users can delete their own saved rundowns" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Editor chefe can delete all saved rundowns" ON public.espelhos_salvos;

CREATE POLICY "Users can delete their own saved rundowns in accessible telejornais"
ON public.espelhos_salvos
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Editor chefe can delete saved rundowns in accessible telejornais"
ON public.espelhos_salvos
FOR DELETE
TO authenticated
USING (
  get_current_user_role() = 'editor_chefe'::text
  AND can_access_telejornal(auth.uid(), telejornal_id)
);