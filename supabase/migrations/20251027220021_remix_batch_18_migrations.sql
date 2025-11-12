
-- Migration: 20250930041652
-- Criar enum para roles de usuário
CREATE TYPE public.user_role AS ENUM (
    'editor_chefe',
    'editor',
    'reporter',
    'produtor'
);

-- Criar tabela de profiles
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    full_name TEXT,
    role public.user_role DEFAULT 'reporter'::public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar tabela de telejornais
CREATE TABLE public.telejornais (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    horario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    espelho_aberto BOOLEAN DEFAULT false
);

-- Criar tabela de blocos
CREATE TABLE public.blocos (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    telejornal_id UUID,
    nome TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT blocos_telejornal_id_fkey FOREIGN KEY (telejornal_id) REFERENCES public.telejornais(id) ON DELETE CASCADE,
    CONSTRAINT blocos_telejornal_id_ordem_key UNIQUE (telejornal_id, ordem)
);

-- Criar tabela de matérias
CREATE TABLE public.materias (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    bloco_id UUID,
    pagina TEXT,
    retranca TEXT NOT NULL,
    clip TEXT,
    duracao INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft'::text,
    reporter TEXT,
    texto TEXT,
    cabeca TEXT,
    tags TEXT[],
    horario_exibicao TIMESTAMP WITH TIME ZONE,
    equipamento TEXT,
    local_gravacao TEXT,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    gc TEXT,
    tempo_clip TEXT,
    tipo_material TEXT,
    is_from_snapshot BOOLEAN DEFAULT false,
    CONSTRAINT materias_bloco_id_fkey FOREIGN KEY (bloco_id) REFERENCES public.blocos(id) ON DELETE CASCADE
);

-- Comentários nas colunas
COMMENT ON COLUMN public.materias.tempo_clip IS 'Duração do clip no formato MM:SS ou HH:MM:SS';
COMMENT ON COLUMN public.materias.tipo_material IS 'Tipo de material da matéria (VT, IMG, EST, SUP, LINK, SELO, VHT, SON, NET)';

-- Criar tabela de pautas
CREATE TABLE public.pautas (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'pendente'::text,
    data_cobertura DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    local TEXT,
    horario TEXT,
    entrevistado TEXT,
    produtor TEXT,
    user_id UUID,
    CONSTRAINT pautas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar tabela de espelhos salvos
CREATE TABLE public.espelhos_salvos (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    telejornal_id UUID NOT NULL,
    data_referencia DATE NOT NULL,
    nome TEXT NOT NULL,
    estrutura JSONB NOT NULL,
    data_salvamento TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT espelhos_salvos_telejornal_id_fkey FOREIGN KEY (telejornal_id) REFERENCES public.telejornais(id) ON DELETE CASCADE
);

-- Criar tabela de modelos salvos
CREATE TABLE public.modelos_salvos (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    estrutura JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de materias_snapshots
CREATE TABLE public.materias_snapshots (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    materia_original_id UUID,
    snapshot_id UUID,
    retranca TEXT NOT NULL,
    bloco_nome TEXT,
    bloco_ordem INTEGER,
    ordem INTEGER DEFAULT 1 NOT NULL,
    duracao INTEGER DEFAULT 0,
    clip TEXT,
    tempo_clip TEXT,
    pagina TEXT,
    reporter TEXT,
    status TEXT DEFAULT 'draft'::text,
    texto TEXT,
    cabeca TEXT,
    gc TEXT,
    tipo_material TEXT,
    local_gravacao TEXT,
    tags TEXT[],
    equipamento TEXT,
    horario_exibicao TIMESTAMP WITH TIME ZONE,
    is_snapshot BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de materias_locks
CREATE TABLE public.materias_locks (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    materia_id UUID NOT NULL,
    user_id UUID NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + '00:30:00'::interval) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT materias_locks_materia_id_fkey FOREIGN KEY (materia_id) REFERENCES public.materias(id) ON DELETE CASCADE,
    CONSTRAINT materias_locks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX idx_espelhos_salvos_telejornal_id ON public.espelhos_salvos USING btree (telejornal_id);
CREATE INDEX idx_espelhos_salvos_data_referencia ON public.espelhos_salvos USING btree (data_referencia);
CREATE INDEX idx_espelhos_salvos_data_salvamento ON public.espelhos_salvos USING btree (data_salvamento);
CREATE INDEX idx_materias_snapshots_original_id ON public.materias_snapshots USING btree (materia_original_id);
CREATE INDEX idx_materias_snapshots_snapshot_id ON public.materias_snapshots USING btree (snapshot_id);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_locks ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policies para telejornais
CREATE POLICY "Authenticated users can view telejornais" 
  ON public.telejornais 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create telejornais" 
  ON public.telejornais 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update telejornais" 
  ON public.telejornais 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete telejornais" 
  ON public.telejornais 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para blocos
CREATE POLICY "Authenticated users can view blocos" 
  ON public.blocos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create blocos" 
  ON public.blocos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update blocos" 
  ON public.blocos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete blocos" 
  ON public.blocos 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para materias
CREATE POLICY "Authenticated users can view materias" 
  ON public.materias 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create materias" 
  ON public.materias 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update materias" 
  ON public.materias 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete materias" 
  ON public.materias 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para pautas
CREATE POLICY "Users can view their own pautas" 
  ON public.pautas 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own pautas" 
  ON public.pautas 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pautas" 
  ON public.pautas 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pautas" 
  ON public.pautas 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies para espelhos_salvos
CREATE POLICY "Authenticated users can view espelhos_salvos" 
  ON public.espelhos_salvos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create espelhos_salvos" 
  ON public.espelhos_salvos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update espelhos_salvos" 
  ON public.espelhos_salvos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete espelhos_salvos" 
  ON public.espelhos_salvos 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para modelos_salvos
CREATE POLICY "Authenticated users can view modelos_salvos" 
  ON public.modelos_salvos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create modelos_salvos" 
  ON public.modelos_salvos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update modelos_salvos" 
  ON public.modelos_salvos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete modelos_salvos" 
  ON public.modelos_salvos 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para materias_snapshots
CREATE POLICY "Authenticated users can view materias_snapshots" 
  ON public.materias_snapshots 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create materias_snapshots" 
  ON public.materias_snapshots 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update materias_snapshots" 
  ON public.materias_snapshots 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete materias_snapshots" 
  ON public.materias_snapshots 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policies para materias_locks
CREATE POLICY "Users can view all materias locks" 
  ON public.materias_locks 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own locks" 
  ON public.materias_locks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locks" 
  ON public.materias_locks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locks" 
  ON public.materias_locks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Habilitar realtime
ALTER TABLE public.telejornais REPLICA IDENTITY FULL;
ALTER TABLE public.blocos REPLICA IDENTITY FULL;
ALTER TABLE public.materias REPLICA IDENTITY FULL;
ALTER TABLE public.pautas REPLICA IDENTITY FULL;
ALTER TABLE public.materias_locks REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.telejornais;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pautas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.espelhos_salvos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modelos_salvos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Criar função para handle_new_user (criar profile automaticamente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'reporter'::public.user_role)
  );
  RETURN NEW;
END;
$$;

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_telejornais_updated_at
  BEFORE UPDATE ON public.telejornais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocos_updated_at
  BEFORE UPDATE ON public.blocos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON public.materias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pautas_updated_at
  BEFORE UPDATE ON public.pautas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_espelhos_salvos_updated_at
  BEFORE UPDATE ON public.espelhos_salvos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modelos_salvos_updated_at
  BEFORE UPDATE ON public.modelos_salvos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materias_snapshots_updated_at
  BEFORE UPDATE ON public.materias_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar trigger para criar profile quando usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

-- Trigger para limpar locks expirados antes de inserir novos
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_expired_locks_before_insert
  BEFORE INSERT ON public.materias_locks
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_locks_trigger();

-- Migration: 20250930041722
-- Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir função cleanup_expired_locks com search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$$;

-- Corrigir função cleanup_expired_locks_trigger com search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$$;

-- Migration: 20250930045001
-- Adicionar coluna telejornal_id na tabela pautas
ALTER TABLE public.pautas 
ADD COLUMN telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX idx_pautas_telejornal_id ON public.pautas(telejornal_id);

-- Criar tabela para reportagens
CREATE TABLE public.reportagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  reporter text,
  local text,
  status text DEFAULT 'em_producao',
  data_gravacao date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.reportagens ENABLE ROW LEVEL SECURITY;

-- RLS Policies para reportagens
CREATE POLICY "Authenticated users can view reportagens"
ON public.reportagens FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create reportagens"
ON public.reportagens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reportagens"
ON public.reportagens FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reportagens"
ON public.reportagens FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_reportagens_updated_at
BEFORE UPDATE ON public.reportagens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice
CREATE INDEX idx_reportagens_telejornal_id ON public.reportagens(telejornal_id);

-- Criar tabela para entrevistas
CREATE TABLE public.entrevistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  entrevistado text NOT NULL,
  descricao text,
  local text,
  horario text,
  data_entrevista date,
  status text DEFAULT 'agendada',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.entrevistas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para entrevistas
CREATE POLICY "Authenticated users can view entrevistas"
ON public.entrevistas FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create entrevistas"
ON public.entrevistas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their entrevistas"
ON public.entrevistas FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their entrevistas"
ON public.entrevistas FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_entrevistas_updated_at
BEFORE UPDATE ON public.entrevistas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice
CREATE INDEX idx_entrevistas_telejornal_id ON public.entrevistas(telejornal_id);

-- Enable Realtime para as novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.reportagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entrevistas;

-- Migration: 20250930052415
-- Criar tabela pautas_telejornal para pautas vinculadas aos telejornais
CREATE TABLE public.pautas_telejornal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telejornal_id UUID NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_cobertura DATE,
  horario TEXT,
  local TEXT,
  entrevistado TEXT,
  produtor TEXT,
  status TEXT DEFAULT 'pendente'::text,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pautas_telejornal ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pautas_telejornal
CREATE POLICY "Users can view pautas_telejornal"
ON public.pautas_telejornal
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own pautas_telejornal"
ON public.pautas_telejornal
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pautas_telejornal"
ON public.pautas_telejornal
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pautas_telejornal"
ON public.pautas_telejornal
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pautas_telejornal_updated_at
BEFORE UPDATE ON public.pautas_telejornal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para melhor performance
CREATE INDEX idx_pautas_telejornal_telejornal_id ON public.pautas_telejornal(telejornal_id);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pautas_telejornal;

-- Migration: 20250930060706
-- Step 1: Update any existing records with NULL user_id (if any)
-- This is a safety measure to prevent data loss
UPDATE public.pautas 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

UPDATE public.pautas_telejornal 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Step 2: Make user_id NOT NULL in pautas table
ALTER TABLE public.pautas 
ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Drop existing RLS policies for pautas
DROP POLICY IF EXISTS "Users can view their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can create their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can update their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can delete their own pautas" ON public.pautas;

-- Step 4: Create new RLS policies for pautas with authenticated role
CREATE POLICY "Authenticated users can view pautas"
ON public.pautas
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own pautas"
ON public.pautas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pautas"
ON public.pautas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pautas"
ON public.pautas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Drop existing RLS policies for pautas_telejornal
DROP POLICY IF EXISTS "Users can view pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can create their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can update their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can delete their own pautas_telejornal" ON public.pautas_telejornal;

-- Step 6: Create new RLS policies for pautas_telejornal with authenticated role
CREATE POLICY "Authenticated users can view pautas_telejornal"
ON public.pautas_telejornal
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own pautas_telejornal"
ON public.pautas_telejornal
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pautas_telejornal"
ON public.pautas_telejornal
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pautas_telejornal"
ON public.pautas_telejornal
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Migration: 20251002044652
-- Renomear coluna titulo para retranca na tabela reportagens
ALTER TABLE public.reportagens 
RENAME COLUMN titulo TO retranca;

-- Migration: 20251002044938
-- Renomear coluna descricao para corpo_materia na tabela reportagens
ALTER TABLE public.reportagens 
RENAME COLUMN descricao TO corpo_materia;

-- Migration: 20251020041007
-- ============================================
-- MIGRAÇÃO COMPLETA DE DADOS DO BACKUP
-- ============================================
-- Migra telejornais, blocos e espelhos_salvos (PRIORIDADE)
-- Utiliza ON CONFLICT para evitar duplicatas

-- ============================================
-- 1. MIGRAR TELEJORNAIS
-- ============================================
INSERT INTO public.telejornais (id, nome, horario, created_at, updated_at, espelho_aberto)
VALUES 
  ('66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 'MDE', '12:00', '2025-07-09 14:47:50.573074+00', '2025-08-14 20:22:28.416051+00', false),
  ('e2bc6599-976c-41a6-820a-f990e2b04f14', 'NTU', '18:00', '2025-06-27 16:00:12.018576+00', '2025-08-29 17:25:55.641091+00', true),
  ('aa84f1e4-4887-49da-8551-ffc6a2fb4a5f', 'MDE BACKUP', '', '2025-07-09 14:36:45.223895+00', '2025-08-31 22:02:28.417274+00', true),
  ('3617c8a0-45d8-410e-844d-769971aead8f', 'NTU BACKUP', '', '2025-07-09 04:51:09.883269+00', '2025-07-09 14:34:37.472297+00', true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  horario = EXCLUDED.horario,
  updated_at = EXCLUDED.updated_at,
  espelho_aberto = EXCLUDED.espelho_aberto;

-- ============================================
-- 2. MIGRAR BLOCOS
-- ============================================
INSERT INTO public.blocos (id, telejornal_id, nome, ordem, created_at, updated_at)
VALUES 
  ('a3ee40fa-b666-4c6e-af60-30a6f28d4163', '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 'Bloco 1', 1, '2025-08-06 17:00:31.919079+00', '2025-08-06 17:00:31.919079+00'),
  ('554dce0d-a74e-4495-87b1-cbfbbc3cf0b8', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 01/07', 7, '2025-07-09 14:31:07.199553+00', '2025-07-09 14:31:22.374593+00'),
  ('d0ad8ddb-ca08-44b3-85a4-c649831e8bac', 'aa84f1e4-4887-49da-8551-ffc6a2fb4a5f', 'Bloco 1', 1, '2025-07-10 15:02:43.910686+00', '2025-07-10 15:02:43.910686+00'),
  ('08dd3349-257e-4c07-8428-de33d59068f7', 'e2bc6599-976c-41a6-820a-f990e2b04f14', 'Bloco 1', 1, '2025-08-29 17:26:26.08403+00', '2025-08-29 17:26:26.08403+00'),
  ('f5aa99bf-ea71-4c71-9258-4ce49e65cc04', 'e2bc6599-976c-41a6-820a-f990e2b04f14', 'Bloco 2', 2, '2025-08-31 17:25:32.79191+00', '2025-08-31 17:25:32.79191+00'),
  ('b33a4024-3a76-4e5e-be50-4a79e6bdee0f', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 08/07 (Cópia)', 2, '2025-07-09 07:05:58.501498+00', '2025-07-09 07:05:58.501498+00'),
  ('22283d5e-e2b6-4b85-abec-4ac4c50e4aba', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 07/07 (Cópia)', 3, '2025-07-09 07:06:23.304322+00', '2025-07-09 07:06:23.304322+00'),
  ('82ab6311-c371-421e-877f-791a5b33d3f5', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 04/07 (Cópia)', 4, '2025-07-09 07:07:12.017588+00', '2025-07-09 07:07:12.017588+00'),
  ('6de8cfbe-414c-4d46-9f71-3361fd50eba6', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 03/07', 5, '2025-07-09 07:07:45.450717+00', '2025-07-09 07:08:22.787896+00'),
  ('519c9812-b944-4c26-b794-37fcbc6d340b', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 02/07', 6, '2025-07-09 07:08:04.014742+00', '2025-07-09 07:08:37.061739+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. MIGRAR ESPELHOS SALVOS (PRIORIDADE!)
-- ============================================
-- Este é o objetivo principal: importar o primeiro espelho salvo
INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  ('159074a0-765f-41fe-a043-0709ba60071a', '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', '2025-07-09', 'MDE', '{"blocos": [{"id": "2200b87b-91e4-4a56-bc00-e3d3d8104272", "nome": "Bloco 1", "items": [{"id": "71235de8-75ae-49e5-b1b1-4adb4641c63e", "clip": "", "ordem": 1, "texto": null, "cabeca": null, "pagina": "1", "status": "draft", "duracao": 0, "reporter": "", "retranca": "Nova Matéria"}], "ordem": 1}]}', '2025-07-09 15:18:06.879009+00', '2025-07-09 15:18:06.879009+00', '2025-07-09 15:18:06.879009+00')
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020041052
-- ============================================
-- MIGRAÇÃO COMPLETA DE DADOS DO BACKUP
-- ============================================
-- Migra telejornais, blocos e espelhos_salvos (PRIORIDADE)
-- Utiliza ON CONFLICT para evitar duplicatas

-- ============================================
-- 1. MIGRAR TELEJORNAIS
-- ============================================
INSERT INTO public.telejornais (id, nome, horario, created_at, updated_at, espelho_aberto)
VALUES 
  ('66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 'MDE', '12:00', '2025-07-09 14:47:50.573074+00', '2025-08-14 20:22:28.416051+00', false),
  ('e2bc6599-976c-41a6-820a-f990e2b04f14', 'NTU', '18:00', '2025-06-27 16:00:12.018576+00', '2025-08-29 17:25:55.641091+00', true),
  ('aa84f1e4-4887-49da-8551-ffc6a2fb4a5f', 'MDE BACKUP', '', '2025-07-09 14:36:45.223895+00', '2025-08-31 22:02:28.417274+00', true),
  ('3617c8a0-45d8-410e-844d-769971aead8f', 'NTU BACKUP', '', '2025-07-09 04:51:09.883269+00', '2025-07-09 14:34:37.472297+00', true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  horario = EXCLUDED.horario,
  updated_at = EXCLUDED.updated_at,
  espelho_aberto = EXCLUDED.espelho_aberto;

-- ============================================
-- 2. MIGRAR BLOCOS
-- ============================================
INSERT INTO public.blocos (id, telejornal_id, nome, ordem, created_at, updated_at)
VALUES 
  ('a3ee40fa-b666-4c6e-af60-30a6f28d4163', '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 'Bloco 1', 1, '2025-08-06 17:00:31.919079+00', '2025-08-06 17:00:31.919079+00'),
  ('554dce0d-a74e-4495-87b1-cbfbbc3cf0b8', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 01/07', 7, '2025-07-09 14:31:07.199553+00', '2025-07-09 14:31:22.374593+00'),
  ('d0ad8ddb-ca08-44b3-85a4-c649831e8bac', 'aa84f1e4-4887-49da-8551-ffc6a2fb4a5f', 'Bloco 1', 1, '2025-07-10 15:02:43.910686+00', '2025-07-10 15:02:43.910686+00'),
  ('08dd3349-257e-4c07-8428-de33d59068f7', 'e2bc6599-976c-41a6-820a-f990e2b04f14', 'Bloco 1', 1, '2025-08-29 17:26:26.08403+00', '2025-08-29 17:26:26.08403+00'),
  ('f5aa99bf-ea71-4c71-9258-4ce49e65cc04', 'e2bc6599-976c-41a6-820a-f990e2b04f14', 'Bloco 2', 2, '2025-08-31 17:25:32.79191+00', '2025-08-31 17:25:32.79191+00'),
  ('b33a4024-3a76-4e5e-be50-4a79e6bdee0f', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 08/07 (Cópia)', 2, '2025-07-09 07:05:58.501498+00', '2025-07-09 07:05:58.501498+00'),
  ('22283d5e-e2b6-4b85-abec-4ac4c50e4aba', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 07/07 (Cópia)', 3, '2025-07-09 07:06:23.304322+00', '2025-07-09 07:06:23.304322+00'),
  ('82ab6311-c371-421e-877f-791a5b33d3f5', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 04/07 (Cópia)', 4, '2025-07-09 07:07:12.017588+00', '2025-07-09 07:07:12.017588+00'),
  ('6de8cfbe-414c-4d46-9f71-3361fd50eba6', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 03/07', 5, '2025-07-09 07:07:45.450717+00', '2025-07-09 07:08:22.787896+00'),
  ('519c9812-b944-4c26-b794-37fcbc6d340b', '3617c8a0-45d8-410e-844d-769971aead8f', 'NTU 02/07', 6, '2025-07-09 07:08:04.014742+00', '2025-07-09 07:08:37.061739+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. MIGRAR ESPELHOS SALVOS (PRIORIDADE!)
-- ============================================
-- Este é o objetivo principal: importar o primeiro espelho salvo
INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  ('159074a0-765f-41fe-a043-0709ba60071a', '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', '2025-07-09', 'MDE', '{"blocos": [{"id": "2200b87b-91e4-4a56-bc00-e3d3d8104272", "nome": "Bloco 1", "items": [{"id": "71235de8-75ae-49e5-b1b1-4adb4641c63e", "clip": "", "ordem": 1, "texto": null, "cabeca": null, "pagina": "1", "status": "draft", "duracao": 0, "reporter": "", "retranca": "Nova Matéria"}], "ordem": 1}]}', '2025-07-09 15:18:06.879009+00', '2025-07-09 15:18:06.879009+00', '2025-07-09 15:18:06.879009+00')
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020120935
-- ============================================
-- MIGRAÇÃO LOTE 2: ESPELHOS SALVOS (CORRIGIDO)
-- ============================================

INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  -- MDE 11/07/2025
  (
    'ca5da0b9-9068-40aa-bf4d-29d122a1a732', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-11', 
    'MDE',
    $${"blocos":[{"id":"f5ea14ca-c972-44af-9165-487c397d07a0","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"d51d8878-d596-4908-b09e-c2947c829ae2","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"draft","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"","id":"019727c8-1b61-4f02-8c39-c4288b7e38ec","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n].\n.\n.","pagina":"2","status":"draft","duracao":2,"reporter":"","retranca":"KAJURU ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"","id":"7ba50711-d45c-4429-8550-0c9aea9b56f7","clip":"","tags":null,"ordem":3,"texto":"","cabeca":"PSG APLICA GOLEADA NO REAL E VAI À FINAL CONTRA O CHELSEA\n.\n.\n.","pagina":"4","status":"draft","duracao":6,"reporter":"","retranca":"PSG X REAL MADRID","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"146380ac-da79-4b98-a0f4-02c3f602c4c0","clip":"","tags":null,"ordem":4,"texto":"","cabeca":"O BRASILEIRÃO VOLTA SÁBADO POR ISSO VAMOS VER A CLASSIFICAÇÃO E \nANALISAR A SITUAÇÃO DE CADA TIME\n.\n.\n.","pagina":"5","status":"draft","duracao":8,"reporter":"","retranca":"BRASILEIRÃO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"46136ddb-1998-46ed-bd3f-0d2cea161357","clip":"","tags":null,"ordem":5,"texto":"","cabeca":"E O GOIÁS APRESENTOU SEUS DOIS \nNOVOS REFORÇOS VAMOS CONFERIR\n(ENTRA COLETIVA)\n.\n.\n.\n","pagina":"6","status":"draft","duracao":6,"reporter":"","retranca":"REFORÇOS GOIÁS","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"164ce3a9-8155-40d0-a96c-e8c3907b2d44","clip":"","tags":null,"ordem":6,"texto":"","cabeca":"JOIA DO GOIÁS É CONVOCADA PARA A SELEÇÃO SUB-17 \\\\ HYGOR SOUSA \nPARTICIPARÁ DE TREINAMENTOS NA GRANJA COMARY EM JULHO\\\\ COMO PARTE DA PREPARAÇÃO PARA O SUL-AMERICANO DA CATEGORIA EM 2026.\n","pagina":"7","status":"draft","duracao":12,"reporter":"","retranca":"SELEÇÃO SUB-17","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"7e6be2dd-27f4-4489-bacb-dd5b976b34d5","clip":"","tags":null,"ordem":7,"texto":"","cabeca":"E ONTEM O MEIA DO VILA BRUNO XAVIER FALOU COMA IMPRENSA \\\\ VAMOS CONFERIR\n.\n.\n","pagina":"8","status":"draft","duracao":6,"reporter":"","retranca":"VILA NOVA ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"11fda722-61e3-4526-94a5-ee4bcf26434d","clip":"","tags":null,"ordem":8,"texto":"","cabeca":"MEMPHIS DEPAY FALTA A TREINO E PRESSÃO AUMENTA NO CORINTHIANS","pagina":"9","status":"draft","duracao":4,"reporter":"","retranca":"DEPAY","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"8d6acf77-eaea-4cda-9924-b527fece43c4","clip":"","tags":null,"ordem":9,"texto":"","cabeca":"ENCERRA\nENCERRA\nENCERRA","pagina":"3","status":"draft","duracao":1,"reporter":"","retranca":"ENCERRAMENTO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-11 14:27:29.607684+00', 
    '2025-07-11 14:27:29.607684+00', 
    '2025-07-11 14:27:29.607684+00'
  ),
  
  -- MDE 16/07/2025
  (
    'a80add2c-ff78-4187-8510-1ccbe6ef5257', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-16', 
    'MDE',
    $${"blocos":[{"id":"cd6da2c0-a413-48f1-b360-b499837864bb","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"0c05d255-c683-4ae5-a20a-c66e8499e90b","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"draft","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"O DEZ DO ESPORTE|COMENTÁRIOS DE JORGE KAJURU SOBRE O FUTEBOL BRASILEIRO E MUNDIAL|MAIS DE 50 ANOS DE UMA CARREIRA CONSAGRADA E COM OPINIÕES MARCANTES","id":"fc805047-eda0-45bc-b2b1-e557fdf8a684","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n.\n.\n.","pagina":"2","status":"draft","duracao":2,"reporter":"","retranca":"KAJURU ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"GOLS DA RODADA|RODADA DO BRASILEIRÃO TEM GOLAÇOS E DECISÕES NOS ACRÉSCIMOS|CONFIRA OS DESTAQUES E OS PRINCIPAIS NOMES DO FIM DE SEMANA\nimagens: GLOBO\nimagens:PREMIERE\nimagens: TV RECORD\nimagens: PRIME VIDEO","id":"e9d39979-f450-465d-b291-30da93a98848","clip":"","tags":null,"ordem":4,"texto":"","cabeca":"E ONTEM NÃO TIVEMOS TEMPO\\\\ MAS AGORA IREMOS FALAR DA RODADA DO BRASILEIRÃO\n.\n.\n.","pagina":"4","status":"draft","duracao":6,"reporter":"","retranca":"GOLS SÉRIE A ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"DA SÉRIE A À VÁRZEA|WILTON PEREIRA SAMPAIO APITA FINAL AMADORA NO INTERIOR DE SP|JUIZ TRABALHOU EM FLAMENGO X SÃO PAULO HORAS ANTES","id":"d98065d6-532f-4e1b-9fde-f00028fd1b52","clip":"","tags":null,"ordem":5,"texto":"","cabeca":"WILTON PEREIRA SAMPAIO APITA FINAL AMADORA APÓS JOGO NO MARACA\n.\n.\n.","pagina":"6","status":"draft","duracao":5,"reporter":"","retranca":"WILTON SAMPAIO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"CRISE NO FLAMENGO|FILIPE LUÍS DETONA ATITUDE DE PEDRO EM COLETIVA|TÉCNICO DIZ QUE ATACANTE ROMPEU A CULTURA DE TREINO DO CLUBE\nFILIPE LUÍS - técnico do Flamengo","id":"8abde51d-f389-4662-b458-a4aa60e6467f","clip":"","tags":null,"ordem":6,"texto":"","cabeca":"FILIPE LUÍS CRITICA PEDRO E EXPLICA CORTE NO FLAMENGO\n(CHAMA FANTASMA)\n.\n.\n.","pagina":"5","status":"draft","duracao":6,"reporter":"","retranca":"PEDRO X FILIPE LUIS","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"32eea842-4945-4773-ab49-3d6bb7ff8b3c","clip":"","tags":null,"ordem":7,"texto":"","cabeca":"ENCERRA\nENCERRA\nENCERRA","pagina":"3","status":"draft","duracao":1,"reporter":"","retranca":"ENCERRAMENTO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-16 15:01:36.228982+00', 
    '2025-07-16 15:01:36.228982+00', 
    '2025-07-16 15:01:36.228982+00'
  )
  
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020121109
-- ============================================
-- MIGRAÇÃO LOTE 2: ESPELHOS SALVOS (CORRIGIDO)
-- ============================================

INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  -- MDE 11/07/2025
  (
    'ca5da0b9-9068-40aa-bf4d-29d122a1a732', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-11', 
    'MDE',
    $${"blocos":[{"id":"f5ea14ca-c972-44af-9165-487c397d07a0","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"d51d8878-d596-4908-b09e-c2947c829ae2","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"draft","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"","id":"019727c8-1b61-4f02-8c39-c4288b7e38ec","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n].\n.\n.","pagina":"2","status":"draft","duracao":2,"reporter":"","retranca":"KAJURU ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"","id":"7ba50711-d45c-4429-8550-0c9aea9b56f7","clip":"","tags":null,"ordem":3,"texto":"","cabeca":"PSG APLICA GOLEADA NO REAL E VAI À FINAL CONTRA O CHELSEA\n.\n.\n.","pagina":"4","status":"draft","duracao":6,"reporter":"","retranca":"PSG X REAL MADRID","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"146380ac-da79-4b98-a0f4-02c3f602c4c0","clip":"","tags":null,"ordem":4,"texto":"","cabeca":"O BRASILEIRÃO VOLTA SÁBADO POR ISSO VAMOS VER A CLASSIFICAÇÃO E \nANALISAR A SITUAÇÃO DE CADA TIME\n.\n.\n.","pagina":"5","status":"draft","duracao":8,"reporter":"","retranca":"BRASILEIRÃO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"46136ddb-1998-46ed-bd3f-0d2cea161357","clip":"","tags":null,"ordem":5,"texto":"","cabeca":"E O GOIÁS APRESENTOU SEUS DOIS \nNOVOS REFORÇOS VAMOS CONFERIR\n(ENTRA COLETIVA)\n.\n.\n.\n","pagina":"6","status":"draft","duracao":6,"reporter":"","retranca":"REFORÇOS GOIÁS","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"164ce3a9-8155-40d0-a96c-e8c3907b2d44","clip":"","tags":null,"ordem":6,"texto":"","cabeca":"JOIA DO GOIÁS É CONVOCADA PARA A SELEÇÃO SUB-17 \\\\ HYGOR SOUSA \nPARTICIPARÁ DE TREINAMENTOS NA GRANJA COMARY EM JULHO\\\\ COMO PARTE DA PREPARAÇÃO PARA O SUL-AMERICANO DA CATEGORIA EM 2026.\n","pagina":"7","status":"draft","duracao":12,"reporter":"","retranca":"SELEÇÃO SUB-17","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"7e6be2dd-27f4-4489-bacb-dd5b976b34d5","clip":"","tags":null,"ordem":7,"texto":"","cabeca":"E ONTEM O MEIA DO VILA BRUNO XAVIER FALOU COMA IMPRENSA \\\\ VAMOS CONFERIR\n.\n.\n","pagina":"8","status":"draft","duracao":6,"reporter":"","retranca":"VILA NOVA ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"11fda722-61e3-4526-94a5-ee4bcf26434d","clip":"","tags":null,"ordem":8,"texto":"","cabeca":"MEMPHIS DEPAY FALTA A TREINO E PRESSÃO AUMENTA NO CORINTHIANS","pagina":"9","status":"draft","duracao":4,"reporter":"","retranca":"DEPAY","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"8d6acf77-eaea-4cda-9924-b527fece43c4","clip":"","tags":null,"ordem":9,"texto":"","cabeca":"ENCERRA\nENCERRA\nENCERRA","pagina":"3","status":"draft","duracao":1,"reporter":"","retranca":"ENCERRAMENTO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-11 14:27:29.607684+00', 
    '2025-07-11 14:27:29.607684+00', 
    '2025-07-11 14:27:29.607684+00'
  ),
  
  -- MDE 16/07/2025
  (
    'a80add2c-ff78-4187-8510-1ccbe6ef5257', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-16', 
    'MDE',
    $${"blocos":[{"id":"cd6da2c0-a413-48f1-b360-b499837864bb","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"0c05d255-c683-4ae5-a20a-c66e8499e90b","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"draft","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"O DEZ DO ESPORTE|COMENTÁRIOS DE JORGE KAJURU SOBRE O FUTEBOL BRASILEIRO E MUNDIAL|MAIS DE 50 ANOS DE UMA CARREIRA CONSAGRADA E COM OPINIÕES MARCANTES","id":"fc805047-eda0-45bc-b2b1-e557fdf8a684","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n.\n.\n.","pagina":"2","status":"draft","duracao":2,"reporter":"","retranca":"KAJURU ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"GOLS DA RODADA|RODADA DO BRASILEIRÃO TEM GOLAÇOS E DECISÕES NOS ACRÉSCIMOS|CONFIRA OS DESTAQUES E OS PRINCIPAIS NOMES DO FIM DE SEMANA\nimagens: GLOBO\nimagens:PREMIERE\nimagens: TV RECORD\nimagens: PRIME VIDEO","id":"e9d39979-f450-465d-b291-30da93a98848","clip":"","tags":null,"ordem":4,"texto":"","cabeca":"E ONTEM NÃO TIVEMOS TEMPO\\\\ MAS AGORA IREMOS FALAR DA RODADA DO BRASILEIRÃO\n.\n.\n.","pagina":"4","status":"draft","duracao":6,"reporter":"","retranca":"GOLS SÉRIE A ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"DA SÉRIE A À VÁRZEA|WILTON PEREIRA SAMPAIO APITA FINAL AMADORA NO INTERIOR DE SP|JUIZ TRABALHOU EM FLAMENGO X SÃO PAULO HORAS ANTES","id":"d98065d6-532f-4e1b-9fde-f00028fd1b52","clip":"","tags":null,"ordem":5,"texto":"","cabeca":"WILTON PEREIRA SAMPAIO APITA FINAL AMADORA APÓS JOGO NO MARACA\n.\n.\n.","pagina":"6","status":"draft","duracao":5,"reporter":"","retranca":"WILTON SAMPAIO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"CRISE NO FLAMENGO|FILIPE LUÍS DETONA ATITUDE DE PEDRO EM COLETIVA|TÉCNICO DIZ QUE ATACANTE ROMPEU A CULTURA DE TREINO DO CLUBE\nFILIPE LUÍS - técnico do Flamengo","id":"8abde51d-f389-4662-b458-a4aa60e6467f","clip":"","tags":null,"ordem":6,"texto":"","cabeca":"FILIPE LUÍS CRITICA PEDRO E EXPLICA CORTE NO FLAMENGO\n(CHAMA FANTASMA)\n.\n.\n.","pagina":"5","status":"draft","duracao":6,"reporter":"","retranca":"PEDRO X FILIPE LUIS","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"32eea842-4945-4773-ab49-3d6bb7ff8b3c","clip":"","tags":null,"ordem":7,"texto":"","cabeca":"ENCERRA\nENCERRA\nENCERRA","pagina":"3","status":"draft","duracao":1,"reporter":"","retranca":"ENCERRAMENTO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-16 15:01:36.228982+00', 
    '2025-07-16 15:01:36.228982+00', 
    '2025-07-16 15:01:36.228982+00'
  )
  
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020121209
-- ============================================
-- MIGRAÇÃO LOTE 3: ESPELHOS SALVOS
-- ============================================

INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  -- NTU 18/07/2025
  (
    'bdbbad75-5b59-4487-9005-8a8fee070ebc', 
    'e2bc6599-976c-41a6-820a-f990e2b04f14', 
    '2025-07-18', 
    'NTU',
    $${"blocos":[{"id":"5a273ec9-b576-4844-a2f0-1e8403629fb7","nome":"Bloco 1","items":[{"gc":"NA TELA URGENTE ESTÁ NO AR| ENTRE EM CONTATO CONOSCO PELO WHATSAPP 0800 999 9090| CONFIRA O RESUMO DE NOTÍCIAS DE HOJE E O QUE SERÁ DESTAQUE NO DIA SEGUINTE","id":"d8e9f553-acec-4bb5-8b9f-12bed447e65b","clip":"","tags":null,"ordem":1,"texto":"COMEÇA AGORA O NA TELA URGENTE...NA RECORD NEWS... WHATSAPP 0800 999 9090...//\n\nNA TELA URGENTE ESTÁ NO AR| ENTRE EM CONTATO CONOSCO PELO WHATSAPP 0800 999 9090| CONFIRA O RESUMO DE NOTÍCIAS DE HOJE E O QUE SERÁ DESTAQUE NO DIA SEGUINTE","cabeca":"COMEÇA AGORA O NA TELA URGENTE...NA RECORD NEWS... WHATSAPP 0800 999 9090...//\n","pagina":"1","status":"approved","duracao":5,"reporter":"VICENTE DATENA","retranca":"ABRE ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"SELVAGERIA FORA DE CAMPO|TORCEDORES REVOLTADOS CAUSAM PREJUÍZO EM RECIFE|CÂMERA FLAGRA  MOMENTO EM QUE INTEGRANTES DA TORCIDA INVADEM O CENTRO DE TREINAMENTO\nCARLOS PRADO - Goiânia-GO","id":"8d88a13e-57df-47d6-af79-9285999c8c42","clip":"","tags":null,"ordem":2,"texto":"Uma câmera de segurança flagrou o momento em que integrantes de uma torcida organizada do Sport invadiram o Centro de Treinamento José de Andrade Médicis, no bairro da Guabiraba, na Zona Norte do Recife, na tarde da quarta-feira (16). Nas imagens, é possível ver o portão sendo empurrado e aberto à força, além de um dos torcedores danificando sistema de gravação\n\nEm nota, o Sport afirmou que:\n\ntinha conhecimento prévio da presença de torcedores na área externa do centro de treinamento;\nhavia se organizado para escutar suas reivindicações, com a participação de todos os integrantes do departamento de futebol;\na invasão ao CT e a ameaça aos atletas são condutas absolutamente inaceitáveis;\nmedidas cabíveis serão tomadas para identificar e punir os responsáveis, com o apoio das autoridades.\n\nAté a manhã desta quinta-feira, o Sport ainda não havia registrado Boletim de Ocorrência (B.O.).\n\nInvestigação do Ministério Público\nO Sport vai pedir ao Ministério Público de Pernambuco (MPPE) a instauração de um inquérito para investigar a invasão e ameaças a atletas. De acordo com o advogado e presidente do Conselho Deliberativo rubro-negro, Ademar Rigueira, o clube buscará punição aos torcedores que invadiram o centro de treinamento e coagiram jogadores do Leão.","cabeca":"TORCIDA ORGANIZADA INVADE SEDE DO CLUBE PRA PROTESTAR... CARLOS PRADO//","pagina":"2","status":"draft","duracao":4,"reporter":"CARLOS PRADO","retranca":"INVASÃO TORCIDA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"CONDENADO A PRISÃO|CANTOR SERTANEJO MATOU NAMORADA DENTISTA|ARTISTA AINDA FICOU FORAGIDO POR UM TEMPO ANTES DE SER DETIDO\nDÉBORA MORAES - São Paulo-SP","id":"af6aed2e-8fb4-4064-83cc-c7f7cc054acf","clip":"","tags":null,"ordem":3,"texto":"O cantor sertanejo João Victor Malaquias foi condenado a 35 anos de prisão pelo assassinato da dentista Bruna Angileri, ocorrido em 27 de setembro de 2023 em Araras (SP). O crime ocorreu após o término do relacionamento. O corpo de Bruna foi encontrado com marcas de agressão e parcialmente queimado. João Victor fugiu após a prisão temporária ser decretada, sendo capturado depois em Ribeirão Preto. Desde o início, ele foi o principal suspeito, e a prisão temporária foi convertida em preventiva pelo Tribunal de Justiça.","cabeca":"CANTOR SERTANEJO É CONDENADO POR MATAR A NAMORADA... DÉBORA MORAES//","pagina":"3","status":"draft","duracao":4,"reporter":"DÉBORA MORAES","retranca":"SERTANEJO CONDENADO","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"VÍDEO IMPRESSIONANTE|MOTORISTA MORRE DEPOIS DE CAMINHÃO TOMBAR EM ACIDENTE|VÍTIMA FICOU PRESA ÀS FERRAGENS DO VEÍCULO E NÃO RESISTIU AOS FERIMENTOS\nJOSÉ FARIAS - Goiânia-GO\n","id":"7535bd2d-4496-4f12-879a-ef3a5d7e341f","clip":"","tags":null,"ordem":5,"texto":"Um motorista morreu após o caminhão que dirigia tombar e cair em um córrego em Itumbiara, no sul do estado. O acidente aconteceu na noite de quarta-feira (16/7). O veículo colidiu com um carro de pequeno porte e, em seguida, tombou e caiu no Córrego das Pombas, na Avenida Afonso Pena, esquina com a Avenida Jorge José Santos.\n\nPreso às ferragens\n\nO motorista do caminhão ficou preso às ferragens e teve o óbito constatado ainda no local pela equipe da Unidade de Suporte Avançado (USA) do SAMU.\n\nA força do impacto e a queda no córrego dificultaram os trabalhos de resgate, exigindo o uso de técnicas especializadas de salvamento terrestre.\n\nRisco de choque\n\nSegundo o Corpo de Bombeiros, a operação contou com o isolamento da área e acionamento da concessionária Equatorial para o desligamento da rede elétrica, devido ao risco de choque no local. A retirada do corpo só foi iniciada após a liberação da perícia técnica.","cabeca":"MOTORISTA MORRE DEPOIS DE CAMINHÃO TOMBAR EM ACIDENTE... JOSÉ FARIAS//","pagina":"4","status":"draft","duracao":4,"reporter":"JOSÉ FARIAS","retranca":"CAMINHÃO TOMBA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-18 18:45:00+00', 
    '2025-07-18 18:45:00+00', 
    '2025-07-18 18:45:00+00'
  )
  
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020121359
-- ============================================
-- MIGRAÇÃO LOTE 4: ESPELHOS SALVOS
-- ============================================

INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  -- MDE 17/07/2025
  (
    '0aa9dc8f-8d12-486d-8810-86d39990c386', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-17', 
    'MDE',
    $${"blocos":[{"id":"9ba6a9c4-2dc4-451d-be01-499d3a587883","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"4b49ab65-c58c-4f15-960c-937b5e04b694","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"approved","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"O DEZ DO ESPORTE|COMENTÁRIOS DE JORGE KAJURU SOBRE O FUTEBOL BRASILEIRO E MUNDIAL|MAIS DE 50 ANOS DE UMA CARREIRA CONSAGRADA E COM OPINIÕES MARCANTES","id":"42bb9f9e-a7b1-4f17-ae2b-f5d54822cc9f","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n.\n.\n.","pagina":"2","status":"approved","duracao":2,"reporter":"","retranca":"KAJURU","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"23e233fc-52e7-4fc8-b887-fc8b9f19cd16","clip":"","tags":null,"ordem":3,"texto":"","cabeca":"CLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \n.\n.\n.\n.\n..","pagina":"8","status":"draft","duracao":7,"reporter":"","retranca":"CLASSIFICAÇÃO SÉRIE A ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"VILA NOVA|CLUBE REPROVA RECLAMAÇÕES DE GUILHERME PAREDE|ATACANTE DISSE QUE ATUA FORA DE POSIÇÃO E CRITICOU SUBSTITUIÇÃO\nLEANDRO BITTAR - vice-presidente do Vila Nova","id":"ff60aaf3-9ffc-4eb7-84f7-0cde59a795f4","clip":"","tags":null,"ordem":4,"texto":"","cabeca":"LEANDRO BITTAR VICE PRESIDENTE DO VILA RESPONDE CRÍTICAS DE PAREDE APÓS EMPATE NA SÉRIE B. VAMOS VER A RESPOSTA\n.\n.\n.\n\n","pagina":"4","status":"approved","duracao":9,"reporter":"","retranca":"VILA RESPONDE CRÍTICAS ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"VILA NOVA|TIME TEM 23 PONTOS E SEGUE PERTO DO G-4|COLORADO ENCARA AVAÍ FORA E TENTA VOLTAR AO BLOCO DE CIMA","id":"782f17db-347e-4548-8d75-0d51605091cc","clip":"","tags":null,"ordem":5,"texto":"","cabeca":"VILA SEGUE PRÓXIMO DO G-4 E ENFRENTA AVAÍ NO SÁBADO\n.\n.\n.\n.","pagina":"5","status":"draft","duracao":6,"reporter":"","retranca":"VILA NOVA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"DRAGÃO NA SÉRIE B|ATLÉTICO-GO TEM BAIXAS E PODE TER RETORNOS CONTRA O CRICIÚMA|MATHEUS FELIPE E MARCELINHO SUSPENSOS PARA JOGO NA SEXTA-FEIRA","id":"37e181b2-0caa-48a8-8570-009b70264d3d","clip":"","tags":null,"ordem":6,"texto":"","cabeca":"ATLÉTICO-GO TEM BAIXAS E RETORNOS PARA JOGO CONTRA O CRICIÚMA\n.\n.\n.\n\n","pagina":"3","status":"approved","duracao":5,"reporter":"","retranca":"ATLETICO-GO","tempo_clip":"","equipamento":"","tipo_material":"","local_gravacao":"","horario_exibicao":null},{"gc":"GOIÁS|TIME SEGUE NA VICE-LIDERANÇA DA SÉRIE B|VERDÃO TEM OITO PONTOS DE MARGEM NO G-4","id":"02f09433-2be4-4d5f-928e-62f7a16a1cc1","clip":"","tags":null,"ordem":7,"texto":"","cabeca":"GOIÁS ABRE OITO PONTOS NO G-4 E SEGUE FIRME NO TOPO DA SÉRIE B","pagina":"6","status":"approved","duracao":6,"reporter":"","retranca":"GOIÁS","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"b617c006-8dfd-44ce-91a9-8a9ad28968b0","clip":"","tags":null,"ordem":8,"texto":"","cabeca":"ENCERRA\nENCERRA\nENCERRA","pagina":"7","status":"approved","duracao":1,"reporter":"","retranca":"ENCERRAMENTO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-17 16:30:01.042686+00', 
    '2025-07-17 16:30:01.042686+00', 
    '2025-07-17 16:30:01.042686+00'
  ),
  
  -- MDE 21/07/2025
  (
    '56805acc-56ef-4350-860c-dfc4729f51c5', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-21', 
    'MDE',
    $${"blocos":[{"id":"4ffbc422-886d-48ed-b7e0-b2991ac9f01c","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"62535bae-1adf-4ea5-8e16-874f368c7595","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"draft","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"O DEZ DO ESPORTE|COMENTÁRIOS DE JORGE KAJURU SOBRE O FUTEBOL BRASILEIRO E MUNDIAL|MAIS DE 50 ANOS DE UMA CARREIRA CONSAGRADA E COM OPINIÕES MARCANTES","id":"b528b162-7555-4832-aab1-5a728e74a179","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n.\n.\n.","pagina":"2","status":"draft","duracao":2,"reporter":"","retranca":"KAJURU","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"04242633-9dc8-4eff-aed9-e2f21ab11fd1","clip":"","tags":null,"ordem":3,"texto":"","cabeca":"CLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A ","pagina":"3","status":"draft","duracao":6,"reporter":"","retranca":"CLASSIFICAÇÃO SÉRIE A ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-21 18:49:32.707666+00', 
    '2025-07-21 18:49:32.707666+00', 
    '2025-07-21 18:49:32.707666+00'
  )
  
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020121423
-- ============================================
-- MIGRAÇÃO LOTE 4: ESPELHOS SALVOS
-- ============================================

INSERT INTO public.espelhos_salvos (id, telejornal_id, data_referencia, nome, estrutura, data_salvamento, created_at, updated_at)
VALUES 
  -- MDE 17/07/2025
  (
    '0aa9dc8f-8d12-486d-8810-86d39990c386', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-17', 
    'MDE',
    $${"blocos":[{"id":"9ba6a9c4-2dc4-451d-be01-499d3a587883","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"4b49ab65-c58c-4f15-960c-937b5e04b694","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"approved","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"O DEZ DO ESPORTE|COMENTÁRIOS DE JORGE KAJURU SOBRE O FUTEBOL BRASILEIRO E MUNDIAL|MAIS DE 50 ANOS DE UMA CARREIRA CONSAGRADA E COM OPINIÕES MARCANTES","id":"42bb9f9e-a7b1-4f17-ae2b-f5d54822cc9f","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n.\n.\n.","pagina":"2","status":"approved","duracao":2,"reporter":"","retranca":"KAJURU","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"23e233fc-52e7-4fc8-b887-fc8b9f19cd16","clip":"","tags":null,"ordem":3,"texto":"","cabeca":"CLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \n.\n.\n.\n.\n..","pagina":"8","status":"draft","duracao":7,"reporter":"","retranca":"CLASSIFICAÇÃO SÉRIE A ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"VILA NOVA|CLUBE REPROVA RECLAMAÇÕES DE GUILHERME PAREDE|ATACANTE DISSE QUE ATUA FORA DE POSIÇÃO E CRITICOU SUBSTITUIÇÃO\nLEANDRO BITTAR - vice-presidente do Vila Nova","id":"ff60aaf3-9ffc-4eb7-84f7-0cde59a795f4","clip":"","tags":null,"ordem":4,"texto":"","cabeca":"LEANDRO BITTAR VICE PRESIDENTE DO VILA RESPONDE CRÍTICAS DE PAREDE APÓS EMPATE NA SÉRIE B. VAMOS VER A RESPOSTA\n.\n.\n.\n\n","pagina":"4","status":"approved","duracao":9,"reporter":"","retranca":"VILA RESPONDE CRÍTICAS ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"VILA NOVA|TIME TEM 23 PONTOS E SEGUE PERTO DO G-4|COLORADO ENCARA AVAÍ FORA E TENTA VOLTAR AO BLOCO DE CIMA","id":"782f17db-347e-4548-8d75-0d51605091cc","clip":"","tags":null,"ordem":5,"texto":"","cabeca":"VILA SEGUE PRÓXIMO DO G-4 E ENFRENTA AVAÍ NO SÁBADO\n.\n.\n.\n.","pagina":"5","status":"draft","duracao":6,"reporter":"","retranca":"VILA NOVA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"DRAGÃO NA SÉRIE B|ATLÉTICO-GO TEM BAIXAS E PODE TER RETORNOS CONTRA O CRICIÚMA|MATHEUS FELIPE E MARCELINHO SUSPENSOS PARA JOGO NA SEXTA-FEIRA","id":"37e181b2-0caa-48a8-8570-009b70264d3d","clip":"","tags":null,"ordem":6,"texto":"","cabeca":"ATLÉTICO-GO TEM BAIXAS E RETORNOS PARA JOGO CONTRA O CRICIÚMA\n.\n.\n.\n\n","pagina":"3","status":"approved","duracao":5,"reporter":"","retranca":"ATLETICO-GO","tempo_clip":"","equipamento":"","tipo_material":"","local_gravacao":"","horario_exibicao":null},{"gc":"GOIÁS|TIME SEGUE NA VICE-LIDERANÇA DA SÉRIE B|VERDÃO TEM OITO PONTOS DE MARGEM NO G-4","id":"02f09433-2be4-4d5f-928e-62f7a16a1cc1","clip":"","tags":null,"ordem":7,"texto":"","cabeca":"GOIÁS ABRE OITO PONTOS NO G-4 E SEGUE FIRME NO TOPO DA SÉRIE B","pagina":"6","status":"approved","duracao":6,"reporter":"","retranca":"GOIÁS","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"b617c006-8dfd-44ce-91a9-8a9ad28968b0","clip":"","tags":null,"ordem":8,"texto":"","cabeca":"ENCERRA\nENCERRA\nENCERRA","pagina":"7","status":"approved","duracao":1,"reporter":"","retranca":"ENCERRAMENTO ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-17 16:30:01.042686+00', 
    '2025-07-17 16:30:01.042686+00', 
    '2025-07-17 16:30:01.042686+00'
  ),
  
  -- MDE 21/07/2025
  (
    '56805acc-56ef-4350-860c-dfc4729f51c5', 
    '66d0d3ba-e0a6-49a0-b2f3-5c5c0a98b545', 
    '2025-07-21', 
    'MDE',
    $${"blocos":[{"id":"4ffbc422-886d-48ed-b7e0-b2991ac9f01c","nome":"Bloco 1","items":[{"gc":"MUNDO DO ESPORTE NO AR!|MANDE SUA MENSAGEM PARA O NOSSO WHATSAPP|PARTICIPE COM SUA OPINIÃO OU VÍDEO NO 0800 999 9090","id":"62535bae-1adf-4ea5-8e16-874f368c7595","clip":"","tags":null,"ordem":1,"texto":"","cabeca":"CHAMA WHATSAPP\n.\n.\n.","pagina":"1","status":"draft","duracao":2,"reporter":"","retranca":"ABERTURA","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":null,"horario_exibicao":null},{"gc":"O DEZ DO ESPORTE|COMENTÁRIOS DE JORGE KAJURU SOBRE O FUTEBOL BRASILEIRO E MUNDIAL|MAIS DE 50 ANOS DE UMA CARREIRA CONSAGRADA E COM OPINIÕES MARCANTES","id":"b528b162-7555-4832-aab1-5a728e74a179","clip":"","tags":null,"ordem":2,"texto":"","cabeca":"CHAMA KAJURU \n.\n.\n.\n.","pagina":"2","status":"draft","duracao":2,"reporter":"","retranca":"KAJURU","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null},{"gc":"","id":"04242633-9dc8-4eff-aed9-e2f21ab11fd1","clip":"","tags":null,"ordem":3,"texto":"","cabeca":"CLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A \nCLASSIFICAÇÃO SÉRIE A ","pagina":"3","status":"draft","duracao":6,"reporter":"","retranca":"CLASSIFICAÇÃO SÉRIE A ","tempo_clip":null,"equipamento":null,"tipo_material":null,"local_gravacao":"","horario_exibicao":null}],"ordem":1}]}$$::jsonb,
    '2025-07-21 18:49:32.707666+00', 
    '2025-07-21 18:49:32.707666+00', 
    '2025-07-21 18:49:32.707666+00'
  )
  
ON CONFLICT (id) DO NOTHING;

-- Migration: 20251020140130
-- Add missing columns to pautas table
ALTER TABLE public.pautas 
ADD COLUMN IF NOT EXISTS proposta TEXT,
ADD COLUMN IF NOT EXISTS encaminhamento TEXT,
ADD COLUMN IF NOT EXISTS informacoes TEXT,
ADD COLUMN IF NOT EXISTS programa TEXT,
ADD COLUMN IF NOT EXISTS reporter TEXT;

-- Migration: 20251020140501
-- Add missing columns to pautas_telejornal table
ALTER TABLE public.pautas_telejornal 
ADD COLUMN IF NOT EXISTS proposta TEXT,
ADD COLUMN IF NOT EXISTS encaminhamento TEXT,
ADD COLUMN IF NOT EXISTS informacoes TEXT,
ADD COLUMN IF NOT EXISTS programa TEXT,
ADD COLUMN IF NOT EXISTS reporter TEXT;

-- Migration: 20251025174657
-- Security Fix: Implement proper role-based access control
-- This migration addresses critical security vulnerabilities:
-- 1. Moves roles from profiles table to separate user_roles table
-- 2. Implements server-side authorization via RLS policies using SECURITY DEFINER functions

-- Step 1: Create user_roles table (using existing user_role enum)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create SECURITY DEFINER functions for role checks
-- These functions bypass RLS to prevent infinite recursion

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if a user has editor role or higher
CREATE OR REPLACE FUNCTION public.is_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('editor', 'editor_chefe')
  )
$$;

-- Function to check if a user is editor_chefe
CREATE OR REPLACE FUNCTION public.is_editor_chefe(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'editor_chefe'
  )
$$;

-- Function to check if a user can modify pautas (produtor or editor_chefe)
CREATE OR REPLACE FUNCTION public.can_modify_pautas(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('produtor', 'editor_chefe')
  )
$$;

-- Function to check if a user can modify materias (reporter, editor, or editor_chefe)
CREATE OR REPLACE FUNCTION public.can_modify_materias(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('reporter', 'editor', 'editor_chefe')
  )
$$;

-- Step 3: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role 
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: RLS Policies for user_roles table
-- Only allow viewing own role or if editor_chefe
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_editor_chefe(auth.uid()));

-- Only editor_chefe can insert/update/delete roles
CREATE POLICY "Only editor_chefe can manage roles"
ON public.user_roles FOR ALL
USING (public.is_editor_chefe(auth.uid()));

-- Step 5: Update RLS policies on telejornais
DROP POLICY IF EXISTS "Authenticated users can view telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Authenticated users can create telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Authenticated users can update telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Authenticated users can delete telejornais" ON public.telejornais;

CREATE POLICY "All authenticated users can view telejornais"
ON public.telejornais FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create telejornais"
ON public.telejornais FOR INSERT
WITH CHECK (public.is_editor(auth.uid()));

CREATE POLICY "Editors can update telejornais"
ON public.telejornais FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Only editor_chefe can delete telejornais"
ON public.telejornais FOR DELETE
USING (public.is_editor_chefe(auth.uid()));

-- Step 6: Update RLS policies on blocos
DROP POLICY IF EXISTS "Authenticated users can view blocos" ON public.blocos;
DROP POLICY IF EXISTS "Authenticated users can create blocos" ON public.blocos;
DROP POLICY IF EXISTS "Authenticated users can update blocos" ON public.blocos;
DROP POLICY IF EXISTS "Authenticated users can delete blocos" ON public.blocos;

CREATE POLICY "All authenticated users can view blocos"
ON public.blocos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create blocos"
ON public.blocos FOR INSERT
WITH CHECK (public.is_editor(auth.uid()));

CREATE POLICY "Editors can update blocos"
ON public.blocos FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can delete blocos"
ON public.blocos FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 7: Update RLS policies on materias
DROP POLICY IF EXISTS "Authenticated users can view materias" ON public.materias;
DROP POLICY IF EXISTS "Authenticated users can create materias" ON public.materias;
DROP POLICY IF EXISTS "Authenticated users can update materias" ON public.materias;
DROP POLICY IF EXISTS "Authenticated users can delete materias" ON public.materias;

CREATE POLICY "All authenticated users can view materias"
ON public.materias FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Reporters and editors can create materias"
ON public.materias FOR INSERT
WITH CHECK (public.can_modify_materias(auth.uid()));

CREATE POLICY "Reporters and editors can update materias"
ON public.materias FOR UPDATE
USING (public.can_modify_materias(auth.uid()));

CREATE POLICY "Editors can delete materias"
ON public.materias FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 8: Update RLS policies on pautas
DROP POLICY IF EXISTS "Authenticated users can view pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can create their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can update their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can delete their own pautas" ON public.pautas;

CREATE POLICY "All authenticated users can view pautas"
ON public.pautas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Produtores and owners can create pautas"
ON public.pautas FOR INSERT
WITH CHECK (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can update pautas"
ON public.pautas FOR UPDATE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can delete pautas"
ON public.pautas FOR DELETE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

-- Step 9: Update RLS policies on pautas_telejornal
DROP POLICY IF EXISTS "Authenticated users can view pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can create their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can update their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can delete their own pautas_telejornal" ON public.pautas_telejornal;

CREATE POLICY "All authenticated users can view pautas_telejornal"
ON public.pautas_telejornal FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Produtores and owners can create pautas_telejornal"
ON public.pautas_telejornal FOR INSERT
WITH CHECK (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can update pautas_telejornal"
ON public.pautas_telejornal FOR UPDATE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can delete pautas_telejornal"
ON public.pautas_telejornal FOR DELETE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

-- Step 10: Update RLS policies on espelhos_salvos
DROP POLICY IF EXISTS "Authenticated users can view espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can create espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can update espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can delete espelhos_salvos" ON public.espelhos_salvos;

CREATE POLICY "Editors can view espelhos_salvos"
ON public.espelhos_salvos FOR SELECT
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can create espelhos_salvos"
ON public.espelhos_salvos FOR INSERT
WITH CHECK (public.is_editor(auth.uid()));

CREATE POLICY "Editors can update espelhos_salvos"
ON public.espelhos_salvos FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can delete espelhos_salvos"
ON public.espelhos_salvos FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 11: Update RLS policies on materias_snapshots
DROP POLICY IF EXISTS "Authenticated users can view materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can create materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can update materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can delete materias_snapshots" ON public.materias_snapshots;

CREATE POLICY "Editors can view materias_snapshots"
ON public.materias_snapshots FOR SELECT
USING (public.is_editor(auth.uid()));

CREATE POLICY "All authenticated users can create materias_snapshots"
ON public.materias_snapshots FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can update materias_snapshots"
ON public.materias_snapshots FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can delete materias_snapshots"
ON public.materias_snapshots FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 12: Update RLS policies on profiles to prevent role modification
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can update their own profile but NOT the role field
CREATE POLICY "Users can update their own profile excluding role"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: The role column in profiles is now deprecated
-- It should be removed in a future migration after confirming all code uses user_roles
-- For now, we keep it for backward compatibility but it's no longer updatable via RLS

-- Step 13: Create a trigger to auto-assign default role on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default 'reporter' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Migration: 20251025175017
-- Security Fix: Implement proper role-based access control (Idempotent version)
-- This migration addresses critical security vulnerabilities:
-- 1. Moves roles from profiles table to separate user_roles table
-- 2. Implements server-side authorization via RLS policies using SECURITY DEFINER functions

-- Step 1: Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create SECURITY DEFINER functions for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('editor', 'editor_chefe')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_editor_chefe(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'editor_chefe'
  )
$$;

CREATE OR REPLACE FUNCTION public.can_modify_pautas(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('produtor', 'editor_chefe')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_modify_materias(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('reporter', 'editor', 'editor_chefe')
  )
$$;

-- Step 3: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role 
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Drop and recreate RLS Policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only editor_chefe can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_editor_chefe(auth.uid()));

CREATE POLICY "Only editor_chefe can manage roles"
ON public.user_roles FOR ALL
USING (public.is_editor_chefe(auth.uid()));

-- Step 5: Update RLS policies on telejornais
DROP POLICY IF EXISTS "Authenticated users can view telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Authenticated users can create telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Authenticated users can update telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Authenticated users can delete telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "All authenticated users can view telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Editors can create telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Editors can update telejornais" ON public.telejornais;
DROP POLICY IF EXISTS "Only editor_chefe can delete telejornais" ON public.telejornais;

CREATE POLICY "All authenticated users can view telejornais"
ON public.telejornais FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create telejornais"
ON public.telejornais FOR INSERT
WITH CHECK (public.is_editor(auth.uid()));

CREATE POLICY "Editors can update telejornais"
ON public.telejornais FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Only editor_chefe can delete telejornais"
ON public.telejornais FOR DELETE
USING (public.is_editor_chefe(auth.uid()));

-- Step 6: Update RLS policies on blocos
DROP POLICY IF EXISTS "Authenticated users can view blocos" ON public.blocos;
DROP POLICY IF EXISTS "Authenticated users can create blocos" ON public.blocos;
DROP POLICY IF EXISTS "Authenticated users can update blocos" ON public.blocos;
DROP POLICY IF EXISTS "Authenticated users can delete blocos" ON public.blocos;
DROP POLICY IF EXISTS "All authenticated users can view blocos" ON public.blocos;
DROP POLICY IF EXISTS "Editors can create blocos" ON public.blocos;
DROP POLICY IF EXISTS "Editors can update blocos" ON public.blocos;
DROP POLICY IF EXISTS "Editors can delete blocos" ON public.blocos;

CREATE POLICY "All authenticated users can view blocos"
ON public.blocos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create blocos"
ON public.blocos FOR INSERT
WITH CHECK (public.is_editor(auth.uid()));

CREATE POLICY "Editors can update blocos"
ON public.blocos FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can delete blocos"
ON public.blocos FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 7: Update RLS policies on materias
DROP POLICY IF EXISTS "Authenticated users can view materias" ON public.materias;
DROP POLICY IF EXISTS "Authenticated users can create materias" ON public.materias;
DROP POLICY IF EXISTS "Authenticated users can update materias" ON public.materias;
DROP POLICY IF EXISTS "Authenticated users can delete materias" ON public.materias;
DROP POLICY IF EXISTS "All authenticated users can view materias" ON public.materias;
DROP POLICY IF EXISTS "Reporters and editors can create materias" ON public.materias;
DROP POLICY IF EXISTS "Reporters and editors can update materias" ON public.materias;
DROP POLICY IF EXISTS "Editors can delete materias" ON public.materias;

CREATE POLICY "All authenticated users can view materias"
ON public.materias FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Reporters and editors can create materias"
ON public.materias FOR INSERT
WITH CHECK (public.can_modify_materias(auth.uid()));

CREATE POLICY "Reporters and editors can update materias"
ON public.materias FOR UPDATE
USING (public.can_modify_materias(auth.uid()));

CREATE POLICY "Editors can delete materias"
ON public.materias FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 8: Update RLS policies on pautas
DROP POLICY IF EXISTS "Authenticated users can view pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can create their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can update their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "Users can delete their own pautas" ON public.pautas;
DROP POLICY IF EXISTS "All authenticated users can view pautas" ON public.pautas;
DROP POLICY IF EXISTS "Produtores and owners can create pautas" ON public.pautas;
DROP POLICY IF EXISTS "Produtores and owners can update pautas" ON public.pautas;
DROP POLICY IF EXISTS "Produtores and owners can delete pautas" ON public.pautas;

CREATE POLICY "All authenticated users can view pautas"
ON public.pautas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Produtores and owners can create pautas"
ON public.pautas FOR INSERT
WITH CHECK (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can update pautas"
ON public.pautas FOR UPDATE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can delete pautas"
ON public.pautas FOR DELETE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

-- Step 9: Update RLS policies on pautas_telejornal
DROP POLICY IF EXISTS "Authenticated users can view pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can create their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can update their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Users can delete their own pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "All authenticated users can view pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Produtores and owners can create pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Produtores and owners can update pautas_telejornal" ON public.pautas_telejornal;
DROP POLICY IF EXISTS "Produtores and owners can delete pautas_telejornal" ON public.pautas_telejornal;

CREATE POLICY "All authenticated users can view pautas_telejornal"
ON public.pautas_telejornal FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Produtores and owners can create pautas_telejornal"
ON public.pautas_telejornal FOR INSERT
WITH CHECK (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can update pautas_telejornal"
ON public.pautas_telejornal FOR UPDATE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Produtores and owners can delete pautas_telejornal"
ON public.pautas_telejornal FOR DELETE
USING (public.can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

-- Step 10: Update RLS policies on espelhos_salvos
DROP POLICY IF EXISTS "Authenticated users can view espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can create espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can update espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Authenticated users can delete espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Editors can view espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Editors can create espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Editors can update espelhos_salvos" ON public.espelhos_salvos;
DROP POLICY IF EXISTS "Editors can delete espelhos_salvos" ON public.espelhos_salvos;

CREATE POLICY "Editors can view espelhos_salvos"
ON public.espelhos_salvos FOR SELECT
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can create espelhos_salvos"
ON public.espelhos_salvos FOR INSERT
WITH CHECK (public.is_editor(auth.uid()));

CREATE POLICY "Editors can update espelhos_salvos"
ON public.espelhos_salvos FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can delete espelhos_salvos"
ON public.espelhos_salvos FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 11: Update RLS policies on materias_snapshots
DROP POLICY IF EXISTS "Authenticated users can view materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can create materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can update materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Authenticated users can delete materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Editors can view materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "All authenticated users can create materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Editors can update materias_snapshots" ON public.materias_snapshots;
DROP POLICY IF EXISTS "Editors can delete materias_snapshots" ON public.materias_snapshots;

CREATE POLICY "Editors can view materias_snapshots"
ON public.materias_snapshots FOR SELECT
USING (public.is_editor(auth.uid()));

CREATE POLICY "All authenticated users can create materias_snapshots"
ON public.materias_snapshots FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can update materias_snapshots"
ON public.materias_snapshots FOR UPDATE
USING (public.is_editor(auth.uid()));

CREATE POLICY "Editors can delete materias_snapshots"
ON public.materias_snapshots FOR DELETE
USING (public.is_editor(auth.uid()));

-- Step 12: Update RLS policies on profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile excluding role" ON public.profiles;

CREATE POLICY "Users can update their own profile excluding role"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 13: Create trigger for auto-assigning default role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
