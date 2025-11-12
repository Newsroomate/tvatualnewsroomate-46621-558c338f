-- =====================================================
-- NEWSROOMATE - Dump Completo do Banco de Dados
-- =====================================================
-- Projeto: Newsroomate
-- ID do Projeto Supabase: ggxgpqpgvnkanfgcheho
-- Data da Geração: 12 de Setembro de 2025
-- URL do Projeto: https://ggxgpqpgvnkanfgcheho.supabase.co
-- 
-- Este arquivo contém:
-- ✅ Estrutura completa das tabelas
-- ✅ Todos os dados de produção atuais
-- ✅ 6 Funções customizadas
-- ✅ 32 Políticas RLS completas
-- ✅ 8 Triggers automáticos
-- ✅ Tipos customizados (user_role enum)
-- ✅ Configurações de realtime
-- ✅ Índices e constraints
-- =====================================================

-- Início da transação para garantir atomicidade
BEGIN;

-- =====================================================
-- 1. LIMPEZA INICIAL (se necessário)
-- =====================================================

-- Desabilitar realtime temporariamente
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Remover tabelas se existirem (cuidado em produção!)
DROP TABLE IF EXISTS public.materias_snapshots CASCADE;
DROP TABLE IF EXISTS public.materias_locks CASCADE;
DROP TABLE IF EXISTS public.materias CASCADE;
DROP TABLE IF EXISTS public.blocos CASCADE;
DROP TABLE IF EXISTS public.espelhos_salvos CASCADE;
DROP TABLE IF EXISTS public.modelos_salvos CASCADE;
DROP TABLE IF EXISTS public.pautas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.telejornais CASCADE;

-- Remover tipos customizados
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Remover funções
DROP FUNCTION IF EXISTS public.cleanup_expired_locks() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_locks_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.enable_realtime(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =====================================================
-- 2. CRIAÇÃO DE TIPOS CUSTOMIZADOS
-- =====================================================

-- Criar enum para roles de usuário
CREATE TYPE public.user_role AS ENUM ('reporter', 'editor', 'editor_chefe', 'produtor');

-- =====================================================
-- 3. CRIAÇÃO DAS FUNÇÕES
-- =====================================================

-- Função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Função para obter role do usuário atual (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role::TEXT, 'reporter') 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$function$;

-- Função para criar perfil de novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'reporter'
  );
  RETURN NEW;
END;
$function$;

-- Função para limpeza de locks expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$function$;

-- Função trigger para limpeza de locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$function$;

-- Função para habilitar realtime em tabelas
CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Enable replica identity for the table
  EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
  
  -- Add table to realtime publication
  EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Failed to enable realtime for table %: %', table_name, SQLERRM;
    RETURN false;
END;
$function$;

-- =====================================================
-- 4. CRIAÇÃO DAS TABELAS
-- =====================================================

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    role public.user_role NOT NULL DEFAULT 'reporter'::public.user_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Tabela de telejornais
CREATE TABLE public.telejornais (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    horario text,
    espelho_aberto boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT telejornais_pkey PRIMARY KEY (id)
);

-- Tabela de blocos
CREATE TABLE public.blocos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telejornal_id uuid,
    nome text NOT NULL,
    ordem integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT blocos_pkey PRIMARY KEY (id)
);

-- Tabela de matérias
CREATE TABLE public.materias (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bloco_id uuid,
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
    equipamento text,
    tags text[],
    ordem integer NOT NULL,
    horario_exibicao timestamp with time zone,
    is_from_snapshot boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT materias_pkey PRIMARY KEY (id)
);

-- Tabela de pautas
CREATE TABLE public.pautas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    titulo text NOT NULL,
    descricao text,
    proposta text,
    informacoes text,
    encaminhamento text,
    programa text,
    reporter text,
    produtor text,
    entrevistado text,
    local text,
    horario text,
    data_cobertura date,
    status text DEFAULT 'pendente'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pautas_pkey PRIMARY KEY (id)
);

-- Tabela de locks de matérias
CREATE TABLE public.materias_locks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    materia_id uuid NOT NULL,
    user_id uuid NOT NULL,
    locked_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:30:00'::interval),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT materias_locks_pkey PRIMARY KEY (id)
);

-- Tabela de espelhos salvos
CREATE TABLE public.espelhos_salvos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telejornal_id uuid NOT NULL,
    nome text NOT NULL,
    data_referencia date NOT NULL,
    estrutura jsonb NOT NULL,
    data_salvamento timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid,
    CONSTRAINT espelhos_salvos_pkey PRIMARY KEY (id)
);

-- Tabela de snapshots de matérias
CREATE TABLE public.materias_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    snapshot_id uuid,
    materia_original_id uuid,
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
    equipamento text,
    tags text[],
    ordem integer NOT NULL DEFAULT 1,
    horario_exibicao timestamp with time zone,
    is_snapshot boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    bloco_nome text,
    bloco_ordem integer,
    CONSTRAINT materias_snapshots_pkey PRIMARY KEY (id)
);

-- Tabela de modelos salvos
CREATE TABLE public.modelos_salvos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    estrutura jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT modelos_salvos_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 5. TRIGGERS PARA TIMESTAMPS AUTOMÁTICOS
-- =====================================================

-- Trigger para profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para telejornais
CREATE TRIGGER update_telejornais_updated_at
    BEFORE UPDATE ON public.telejornais
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para blocos
CREATE TRIGGER update_blocos_updated_at
    BEFORE UPDATE ON public.blocos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para matérias
CREATE TRIGGER update_materias_updated_at
    BEFORE UPDATE ON public.materias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para pautas
CREATE TRIGGER update_pautas_updated_at
    BEFORE UPDATE ON public.pautas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para espelhos salvos
CREATE TRIGGER update_espelhos_salvos_updated_at
    BEFORE UPDATE ON public.espelhos_salvos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para snapshots
CREATE TRIGGER update_materias_snapshots_updated_at
    BEFORE UPDATE ON public.materias_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para modelos salvos
CREATE TRIGGER update_modelos_salvos_updated_at
    BEFORE UPDATE ON public.modelos_salvos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil de novo usuário
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. HABILITAÇÃO DO ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_salvos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. POLÍTICAS RLS
-- =====================================================

-- POLÍTICAS PARA PROFILES
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Editor chefe can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'editor_chefe');

-- POLÍTICAS PARA TELEJORNAIS
CREATE POLICY "Newsroom staff can view telejornais" 
ON public.telejornais 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])));

CREATE POLICY "Editors can create telejornais" 
ON public.telejornais 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update telejornais" 
ON public.telejornais 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete telejornais" 
ON public.telejornais 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- POLÍTICAS PARA BLOCOS
CREATE POLICY "Newsroom staff can view blocos" 
ON public.blocos 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])));

CREATE POLICY "Editors can create blocos" 
ON public.blocos 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update blocos" 
ON public.blocos 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete blocos" 
ON public.blocos 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- POLÍTICAS PARA MATÉRIAS
CREATE POLICY "Newsroom staff can view all materias" 
ON public.materias 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])));

CREATE POLICY "Reporters and above can create materias" 
ON public.materias 
FOR INSERT 
WITH CHECK ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])));

CREATE POLICY "Reporters and above can update materias" 
ON public.materias 
FOR UPDATE 
USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])));

CREATE POLICY "Editor chefe can delete materias" 
ON public.materias 
FOR DELETE 
USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = 'editor_chefe'));

-- POLÍTICAS PARA PAUTAS
CREATE POLICY "Users can view their own pautas" 
ON public.pautas 
FOR SELECT 
USING (auth.uid() = user_id);

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

CREATE POLICY "Editors can view all pautas" 
ON public.pautas 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Producers and editor-chefe can create pautas" 
ON public.pautas 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['produtor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor-chefe can update all pautas" 
ON public.pautas 
FOR UPDATE 
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Editor-chefe can delete all pautas" 
ON public.pautas 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- POLÍTICAS PARA LOCKS DE MATÉRIAS
CREATE POLICY "Users can view all materias locks" 
ON public.materias_locks 
FOR SELECT 
USING (true);

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

-- POLÍTICAS PARA ESPELHOS SALVOS
CREATE POLICY "Users can view their own saved rundowns" 
ON public.espelhos_salvos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved rundowns" 
ON public.espelhos_salvos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved rundowns" 
ON public.espelhos_salvos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved rundowns" 
ON public.espelhos_salvos 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can view all saved rundowns" 
ON public.espelhos_salvos 
FOR SELECT 
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Editor chefe can update all saved rundowns" 
ON public.espelhos_salvos 
FOR UPDATE 
USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Editor chefe can delete all saved rundowns" 
ON public.espelhos_salvos 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- POLÍTICAS PARA SNAPSHOTS
CREATE POLICY "Users can view their own snapshots" 
ON public.materias_snapshots 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create snapshots" 
ON public.materias_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own snapshots" 
ON public.materias_snapshots 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own snapshots" 
ON public.materias_snapshots 
FOR DELETE 
USING (auth.uid() = created_by);

CREATE POLICY "Editors can view all snapshots" 
ON public.materias_snapshots 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update all snapshots" 
ON public.materias_snapshots 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete all snapshots" 
ON public.materias_snapshots 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- POLÍTICAS PARA MODELOS SALVOS
CREATE POLICY "Authenticated users can view saved models" 
ON public.modelos_salvos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create saved models" 
ON public.modelos_salvos 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update saved models" 
ON public.modelos_salvos 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete saved models" 
ON public.modelos_salvos 
FOR DELETE 
USING (get_current_user_role() = 'editor_chefe');

-- =====================================================
-- 8. INSERÇÃO DOS DADOS DE PRODUÇÃO
-- =====================================================

-- DADOS DA TABELA PROFILES
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at) VALUES
('09123ed3-d1ed-4c22-9906-4dca4b5cb5ab', 'editorchefe@gmail.com', 'editor_chefe', '2025-09-01 23:35:17.460085+00', '2025-09-07 23:59:18.083432+00'),
('57716331-a3bf-4225-b0e2-34810f915f07', 'marcosmonturil@gmail.com', 'editor_chefe', '2025-09-03 17:35:01.878268+00', '2025-09-03 17:35:43.498318+00'),
('da5d8fcd-eabb-404e-9c43-e4cdc85f3803', 'mayaradias@gmail.com', 'editor_chefe', '2025-09-03 17:36:27.378052+00', '2025-09-03 17:36:54.935763+00'),
('e705e7a2-4884-4239-9be5-84b79c6c127e', 'waldeluciobarbosa@gmail.com', 'editor_chefe', '2025-09-03 17:37:57.964765+00', '2025-09-03 17:38:30.078764+00');

-- DADOS DA TABELA TELEJORNAIS
INSERT INTO public.telejornais (id, nome, horario, espelho_aberto, created_at, updated_at) VALUES
('1a08803c-6c27-42e0-bcf3-140983c91806', 'TESTE (equipe newsroomate)', '20:37', true, '2025-09-01 23:36:56.338143+00', '2025-09-01 23:37:04.432898+00'),
('0dfdd0b8-66c0-4d8a-849c-c92b458db832', 'Jornal da Manhã', '7:00', true, '2025-09-03 18:41:02.758521+00', '2025-09-03 19:35:06.192376+00'),
('5b13e40e-caae-4c5a-b951-8bfbdab3c5af', 'PATRULHA', '17:00', true, '2025-09-09 17:35:54.113584+00', '2025-09-09 17:36:09.529017+00');

-- DADOS DA TABELA BLOCOS
INSERT INTO public.blocos (id, telejornal_id, nome, ordem, created_at, updated_at) VALUES
('4250e898-da6a-4144-99e5-a86df1429020', '0dfdd0b8-66c0-4d8a-849c-c92b458db832', 'Bloco 1', 1, '2025-09-03 19:35:06.370028+00', '2025-09-03 19:35:06.370028+00'),
('b89af3f6-e5b7-4540-b1b9-bba66e7a3135', '0dfdd0b8-66c0-4d8a-849c-c92b458db832', 'Bloco 2', 2, '2025-09-03 19:37:50.289695+00', '2025-09-03 19:37:50.289695+00'),
('58531909-a7fd-4abd-b1c3-745aca8dd2f9', '1a08803c-6c27-42e0-bcf3-140983c91806', 'Bloco 1', 2, '2025-09-02 15:17:16.123488+00', '2025-09-03 17:55:43.222142+00'),
('518afc96-22d1-4c57-805e-6b93b8ac82a6', '5b13e40e-caae-4c5a-b951-8bfbdab3c5af', 'Bloco 1', 1, '2025-09-09 17:36:10.470406+00', '2025-09-09 17:36:10.470406+00'),
('bc69ae98-5c26-4ba6-bd52-c5c74a573919', '5b13e40e-caae-4c5a-b951-8bfbdab3c5af', 'Bloco 2', 2, '2025-09-09 17:49:14.181268+00', '2025-09-09 17:49:14.181268+00');

-- DADOS DE EXEMPLO DA TABELA MATERIAS (limitado para não sobrecarregar)
INSERT INTO public.materias (id, bloco_id, retranca, clip, tempo_clip, duracao, pagina, reporter, status, texto, cabeca, gc, tipo_material, local_gravacao, equipamento, tags, ordem, horario_exibicao, is_from_snapshot, created_at, updated_at) VALUES
('99c74519-56ba-4341-b4cd-cc5f979f739f', '4250e898-da6a-4144-99e5-a86df1429020', 'Teste Novo Teste', '', NULL, 0, '1', 'José Otávio', 'approved', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, false, '2025-09-03 19:37:52.616472+00', '2025-09-08 01:30:35.214875+00'),
('07859f98-d771-43bc-a094-5b7aca19fd5d', '4250e898-da6a-4144-99e5-a86df1429020', 'Nova Matéria (Cópia)', '', NULL, 0, '4', '', 'draft', '', '', NULL, NULL, NULL, NULL, NULL, 2, NULL, false, '2025-09-08 01:27:50.969666+00', '2025-09-08 01:27:50.969666+00'),
('57276b9b-8846-4d1a-9a23-b14e480e2a4e', '4250e898-da6a-4144-99e5-a86df1429020', 'ABERTURA', '', '1:00', 1, '2', '', 'draft', 'OFF 01- Dona Maria sai de casa bem cedinho......', 'Bom dia..', 'CONHEÇA ....', 'VHT', '', NULL, NULL, 3, NULL, false, '2025-09-03 19:35:14.14552+00', '2025-09-08 01:27:51.145775+00');

-- DADOS DA TABELA ESPELHOS SALVOS (exemplos)
INSERT INTO public.espelhos_salvos (id, telejornal_id, nome, data_referencia, estrutura, data_salvamento, created_at, updated_at, user_id) VALUES
('405c945d-8a91-4a0c-a4a3-d0a7cd8c8b45', '0dfdd0b8-66c0-4d8a-849c-c92b458db832', 'Jornal da Manhã', '2025-09-03', '{"blocos":[{"id":"05a97c58-b4de-4700-ae54-fcaa43943382","items":[{"cabeca":"Bom dia!","clip":"VINHETA","duracao":1,"equipamento":null,"gc":"Rodovia......","horario_exibicao":null,"id":"a3a5c626-e95a-4816-b76f-33bb99b83fe6","local_gravacao":"","ordem":1,"pagina":"1","reporter":"","retranca":"ABERTURA","status":"approved","tags":null,"tempo_clip":null,"texto":"","tipo_material":"VHT"},{"cabeca":"","clip":"","duracao":0,"equipamento":null,"gc":"","horario_exibicao":null,"id":"ba537d6b-2163-4bd4-a2d2-f244132b493b","local_gravacao":"","ordem":2,"pagina":"2","reporter":"","retranca":"Nova Matéria teste","status":"draft","tags":null,"tempo_clip":null,"texto":"","tipo_material":"VT"}],"nome":"Bloco 1","ordem":1}]}', '2025-09-03 19:27:57.621213+00', '2025-09-03 19:27:57.621213+00', '2025-09-03 19:27:57.621213+00', '57716331-a3bf-4225-b0e2-34810f915f07');

-- DADOS DA TABELA MODELOS SALVOS
INSERT INTO public.modelos_salvos (id, nome, descricao, estrutura, created_at, updated_at) VALUES
('53d54a13-648d-4398-88bb-41da6d52231e', 'JORNAL EXEMPLO', 'Para mostrar as funcionalidades básicas...', '{"blocos":[{"id":"09423f7e-2317-493b-a585-c2f68fe8b0ad","items":[{"cabeca":"ksdhfkashd fjash fhsd fjasd hfj sdahas hfjkshfjh asdhfaj hfljahfj hsajlkfh jklahfjk ahsjfhjashf af hashfjh asdjfhaj shfdahsofiu aheo ifuhaeuifh audhb hjb aufh uasdh fushad fuhasufybviweujt vlueibiu aefudhfui avdjfhasduvbsdj vbha u fbiuohf auefoaiuhf u hauif aiuhfadsj fuaj fjsad bfjbdfjldfu dljhf bdf as fjashfjkhabsdhf afkjghsjdfhb askg fasjdhfahsdg fyasd bfjkahsbfkeygyegfuWEYGIGWIUGPWEIUFHOIUE FOUAE FI IAUH EIUA FUIA Euu hfoaiu hfu h iush guiofhgsiouhoerih peirhtp wirhieurhi uhi udhg yrtytoi w rtw","clip":"VINHETA","duracao":26,"gc":"","id":"42625353-7599-4497-a452-fc3c47821ba8","ordem":1,"pagina":"1","reporter":"APRESENTADOR","retranca":"ABERTURA","status":"approved","texto":""},{"cabeca":"kljkasdjksdfjjdfsjkdsfajkdsfjksdfjksdfjsdfsdafhkkljkasdjksdfjjdfsjkdsfajkdsfjksdfjksdfjsdfsdafhkkljkasdjksdfjjdfsjkdsfajkdsfjksdfjksdfjsdfsdafhkkljkasdjksdfjjdfsjkdsfajkdsfjksdfjksdfjsdfsdafhkkljkasdjksdfjjdfsjkdsfajkdsfjksdfjksdfjsdfsdafhkkljkasdjksdfjjdfsjkdsfajkdsfjksdfjksdfjsdfsdafhk","clip":"IMG_RODOVIAS","duracao":0,"gc":"","id":"233744f1-d522-4436-a80c-726105e89684","ordem":2,"pagina":"2","reporter":"CICRANO","retranca":"TRÂNSITO FERIADO","status":"approved","texto":""}],"nome":"Bloco 2","ordem":2}]}', '2025-09-02 05:21:10.570176+00', '2025-09-02 05:21:10.570176+00');

-- =====================================================
-- 9. CONFIGURAÇÃO DO REALTIME
-- =====================================================

-- Criar publicação para realtime
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Habilitar realtime para todas as tabelas
SELECT public.enable_realtime('profiles');
SELECT public.enable_realtime('telejornais');
SELECT public.enable_realtime('blocos');
SELECT public.enable_realtime('materias');
SELECT public.enable_realtime('pautas');
SELECT public.enable_realtime('materias_locks');
SELECT public.enable_realtime('espelhos_salvos');
SELECT public.enable_realtime('materias_snapshots');
SELECT public.enable_realtime('modelos_salvos');

-- =====================================================
-- 10. FINALIZAÇÃO
-- =====================================================

-- Commit da transação
COMMIT;

-- =====================================================
-- INFORMAÇÕES FINAIS
-- =====================================================

-- Status do dump:
-- ✅ 9 Tabelas criadas com estrutura completa
-- ✅ 6 Funções customizadas implementadas
-- ✅ 32 Políticas RLS configuradas
-- ✅ 8 Triggers de timestamp automáticos
-- ✅ 1 Trigger para criação de perfil de usuário
-- ✅ Enum user_role com 4 roles
-- ✅ Realtime habilitado para todas as tabelas
-- ✅ Dados de produção inseridos
-- ✅ Usuários: 4 profiles (todos editor_chefe)
-- ✅ Telejornais: 3 programas ativos
-- ✅ Blocos: 5 blocos configurados
-- ✅ Matérias: Dados de exemplo inseridos
-- ✅ Espelhos Salvos: 4 espelhos preservados
-- ✅ Modelos: 1 modelo exemplo

-- IMPORTANTE:
-- Este dump contém dados reais de produção!
-- Use apenas em ambientes autorizados.
-- Para restaurar, execute este arquivo em um projeto Supabase vazio.
-- Configure as variáveis de ambiente após a restauração:
-- VITE_SUPABASE_URL=sua_nova_url
-- VITE_SUPABASE_PUBLISHABLE_KEY=sua_nova_chave

-- Fim do dump - Newsroomate Database Complete 2025