
-- =====================================================
-- DUMP COMPLETO DA ESTRUTURA DO BANCO DE DADOS
-- Projeto Supabase ID: uzfkkdczshauslcbewqi
-- Gerado em: 2025-01-25
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- TIPOS CUSTOMIZADOS (ENUMS)
-- =====================================================

-- Tipo para roles de usuário
CREATE TYPE public.user_role AS ENUM (
    'reporter',
    'editor',
    'editor_chefe',
    'produtor'
);

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    role public.user_role NOT NULL DEFAULT 'reporter'::public.user_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de telejornais
CREATE TABLE public.telejornais (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    horario text,
    espelho_aberto boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de blocos
CREATE TABLE public.blocos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE CASCADE,
    nome text NOT NULL,
    ordem integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de matérias
CREATE TABLE public.materias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bloco_id uuid REFERENCES public.blocos(id) ON DELETE CASCADE,
    retranca text NOT NULL,
    clip text,
    tempo_clip text,
    duracao integer DEFAULT 0,
    pagina text,
    reporter text,
    status text DEFAULT 'draft'::text,
    texto text,
    cabeca text,
    gc text,
    tipo_material text,
    local_gravacao text,
    tags text[],
    equipamento text,
    ordem integer NOT NULL,
    horario_exibicao timestamp with time zone,
    is_from_snapshot boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de pautas
CREATE TABLE public.pautas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    titulo text NOT NULL,
    descricao text,
    status text DEFAULT 'pendente'::text,
    data_cobertura date,
    horario text,
    entrevistado text,
    produtor text,
    local text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de espelhos salvos
CREATE TABLE public.espelhos_salvos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telejornal_id uuid NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
    nome text NOT NULL,
    data_referencia date NOT NULL,
    estrutura jsonb NOT NULL,
    data_salvamento timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de modelos salvos
CREATE TABLE public.modelos_salvos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    estrutura jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de snapshots de matérias
CREATE TABLE public.materias_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    materia_original_id uuid,
    snapshot_id uuid,
    retranca text NOT NULL,
    bloco_nome text,
    bloco_ordem integer,
    ordem integer NOT NULL DEFAULT 1,
    duracao integer DEFAULT 0,
    clip text,
    tempo_clip text,
    pagina text,
    reporter text,
    status text DEFAULT 'draft'::text,
    texto text,
    cabeca text,
    gc text,
    tipo_material text,
    local_gravacao text,
    tags text[],
    equipamento text,
    horario_exibicao timestamp with time zone,
    is_snapshot boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Tabela de locks de matérias
CREATE TABLE public.materias_locks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    materia_id uuid NOT NULL,
    user_id uuid NOT NULL,
    locked_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:30:00'::interval),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'reporter'
  );
  RETURN NEW;
END;
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para limpar locks expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$$;

-- Função trigger para limpar locks expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$$;

-- Função para atualizar coluna updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para obter role do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(role::TEXT, 'reporter') 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para updated_at nas tabelas
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telejornais_updated_at
  BEFORE UPDATE ON public.telejornais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocos_updated_at
  BEFORE UPDATE ON public.blocos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON public.materias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pautas_updated_at
  BEFORE UPDATE ON public.pautas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_espelhos_salvos_updated_at
  BEFORE UPDATE ON public.espelhos_salvos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modelos_salvos_updated_at
  BEFORE UPDATE ON public.modelos_salvos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materias_snapshots_updated_at
  BEFORE UPDATE ON public.materias_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para limpeza de locks
CREATE TRIGGER cleanup_locks_before_insert
  BEFORE INSERT ON public.materias_locks
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_expired_locks_trigger();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_locks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - PROFILES
-- =====================================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Editor chefe can view all profiles"
  ON public.profiles FOR SELECT
  USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- POLÍTICAS RLS - TELEJORNAIS
-- =====================================================

CREATE POLICY "Authenticated users can view telejornais"
  ON public.telejornais FOR SELECT
  USING (true);

CREATE POLICY "Editors can create telejornais"
  ON public.telejornais FOR INSERT
  WITH CHECK (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editors can update telejornais"
  ON public.telejornais FOR UPDATE
  USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editor chefe can delete telejornais"
  ON public.telejornais FOR DELETE
  USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- POLÍTICAS RLS - BLOCOS
-- =====================================================

CREATE POLICY "Authenticated users can view blocos"
  ON public.blocos FOR SELECT
  USING (true);

CREATE POLICY "Editors can create blocos"
  ON public.blocos FOR INSERT
  WITH CHECK (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editors can update blocos"
  ON public.blocos FOR UPDATE
  USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editor chefe can delete blocos"
  ON public.blocos FOR DELETE
  USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- POLÍTICAS RLS - MATERIAS
-- =====================================================

CREATE POLICY "Authenticated users can view materias"
  ON public.materias FOR SELECT
  USING (true);

CREATE POLICY "Reporters and above can create materias"
  ON public.materias FOR INSERT
  WITH CHECK (get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe']));

CREATE POLICY "Reporters and above can update materias"
  ON public.materias FOR UPDATE
  USING (get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe']));

CREATE POLICY "Editor chefe can delete materias"
  ON public.materias FOR DELETE
  USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- POLÍTICAS RLS - PAUTAS
-- =====================================================

CREATE POLICY "Authenticated users can view pautas"
  ON public.pautas FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own pautas"
  ON public.pautas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pautas"
  ON public.pautas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Producers and editor-chefe can create pautas"
  ON public.pautas FOR INSERT
  WITH CHECK (get_current_user_role() = ANY (ARRAY['produtor', 'editor_chefe']));

CREATE POLICY "Users can update their own pautas"
  ON public.pautas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Editor-chefe can update all pautas"
  ON public.pautas FOR UPDATE
  USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can delete their own pautas"
  ON public.pautas FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Editor-chefe can delete all pautas"
  ON public.pautas FOR DELETE
  USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- POLÍTICAS RLS - ESPELHOS SALVOS
-- =====================================================

CREATE POLICY "Authenticated users can view saved rundowns"
  ON public.espelhos_salvos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create saved rundowns"
  ON public.espelhos_salvos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update saved rundowns"
  ON public.espelhos_salvos FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete saved rundowns"
  ON public.espelhos_salvos FOR DELETE
  USING (true);

-- =====================================================
-- POLÍTICAS RLS - MODELOS SALVOS
-- =====================================================

CREATE POLICY "Anyone can view saved models"
  ON public.modelos_salvos FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create saved models"
  ON public.modelos_salvos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update saved models"
  ON public.modelos_salvos FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete saved models"
  ON public.modelos_salvos FOR DELETE
  USING (true);

-- =====================================================
-- POLÍTICAS RLS - MATERIAS SNAPSHOTS
-- =====================================================

CREATE POLICY "Authenticated users can view snapshots"
  ON public.materias_snapshots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify snapshots"
  ON public.materias_snapshots FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- POLÍTICAS RLS - MATERIAS LOCKS
-- =====================================================

CREATE POLICY "Users can view all materias locks"
  ON public.materias_locks FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own locks"
  ON public.materias_locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locks"
  ON public.materias_locks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locks"
  ON public.materias_locks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX idx_materias_bloco_id ON public.materias(bloco_id);
CREATE INDEX idx_materias_ordem ON public.materias(ordem);
CREATE INDEX idx_blocos_telejornal_id ON public.blocos(telejornal_id);
CREATE INDEX idx_blocos_ordem ON public.blocos(ordem);
CREATE INDEX idx_pautas_user_id ON public.pautas(user_id);
CREATE INDEX idx_pautas_data_cobertura ON public.pautas(data_cobertura);
CREATE INDEX idx_espelhos_salvos_telejornal_id ON public.espelhos_salvos(telejornal_id);
CREATE INDEX idx_espelhos_salvos_data_referencia ON public.espelhos_salvos(data_referencia);
CREATE INDEX idx_materias_snapshots_snapshot_id ON public.materias_snapshots(snapshot_id);
CREATE INDEX idx_materias_locks_materia_id ON public.materias_locks(materia_id);
CREATE INDEX idx_materias_locks_expires_at ON public.materias_locks(expires_at);

-- =====================================================
-- COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuário com roles e informações básicas';
COMMENT ON TABLE public.telejornais IS 'Configuração dos telejornais disponíveis no sistema';
COMMENT ON TABLE public.blocos IS 'Blocos que compõem a estrutura de um telejornal';
COMMENT ON TABLE public.materias IS 'Matérias jornalísticas associadas aos blocos';
COMMENT ON TABLE public.pautas IS 'Pautas de cobertura jornalística';
COMMENT ON TABLE public.espelhos_salvos IS 'Snapshots salvos da estrutura completa de telejornais';
COMMENT ON TABLE public.modelos_salvos IS 'Modelos reutilizáveis de estrutura de telejornal';
COMMENT ON TABLE public.materias_snapshots IS 'Versões arquivadas de matérias para auditoria';
COMMENT ON TABLE public.materias_locks IS 'Sistema de locks para edição concorrente de matérias';

-- =====================================================
-- CONFIGURAÇÕES DE REALTIME (OPCIONAL)
-- =====================================================

-- Habilitar realtime para tabelas críticas
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.materias;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.blocos;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.materias_locks;

-- =====================================================
-- FIM DO DUMP
-- =====================================================
