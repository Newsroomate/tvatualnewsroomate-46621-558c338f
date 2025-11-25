-- =====================================================
-- ETAPA 1: Criar tabela de exceções de permissão
-- =====================================================
CREATE TABLE public.user_telejornal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  telejornal_id uuid NOT NULL REFERENCES telejornais(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, telejornal_id)
);

-- Habilitar RLS
ALTER TABLE public.user_telejornal_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a tabela
CREATE POLICY "Users can view own telejornal access"
ON public.user_telejornal_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe global can view all access"
ON public.user_telejornal_access FOR SELECT
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Editor chefe global can insert access"
ON public.user_telejornal_access FOR INSERT
WITH CHECK (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Editor chefe global can update access"
ON public.user_telejornal_access FOR UPDATE
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Editor chefe global can delete access"
ON public.user_telejornal_access FOR DELETE
USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- ETAPA 2: Criar função para verificar role efetivo
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_effective_telejornal_role(_user_id uuid, _telejornal_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Primeiro: permissão específica do telejornal (se existir)
    (SELECT role::text FROM user_telejornal_access 
     WHERE user_id = _user_id AND telejornal_id = _telejornal_id),
    -- Fallback: role global do usuário
    (SELECT role::text FROM user_roles WHERE user_id = _user_id LIMIT 1),
    -- Default: reporter
    'reporter'
  );
$$;

-- =====================================================
-- ETAPA 3: Atualizar RLS dos telejornais para usar função
-- =====================================================
-- Remover política antiga de UPDATE
DROP POLICY IF EXISTS "Editors can update telejornais" ON telejornais;

-- Nova política que verifica permissão específica OU global
CREATE POLICY "Editors can update telejornais"
ON public.telejornais FOR UPDATE
USING (
  get_effective_telejornal_role(auth.uid(), id) IN ('editor', 'editor_chefe')
);

-- =====================================================
-- ETAPA 4: Habilitar realtime na nova tabela
-- =====================================================
ALTER TABLE public.user_telejornal_access REPLICA IDENTITY FULL;

-- =====================================================
-- ETAPA 5: Inserir permissão específica para o usuário
-- =====================================================
INSERT INTO public.user_telejornal_access (user_id, telejornal_id, role)
VALUES (
  '7c3a39d3-752d-4aa0-86c4-3322a68540ae',  -- hlemes144@gmail.com
  '89968a7b-1fb5-4b7a-8760-4a7fe22fe5cb',  -- CONEXÃO ATUAL
  'editor_chefe'
);