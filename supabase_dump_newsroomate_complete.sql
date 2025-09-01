-- NEWSROOMATE - Dump Completo do Banco de Dados
-- Gerado em: 01/09/2025
-- Projeto: rigluylhplrrlfkssrur
-- 
-- Este dump contém:
-- ✅ Estrutura completa das tabelas
-- ✅ Funções customizadas
-- ✅ Políticas RLS
-- ✅ Triggers
-- ✅ Dados de produção
-- ✅ Configurações de realtime

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('reporter', 'editor', 'editor_chefe', 'produtor');

-- Create tables
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    role public.user_role NOT NULL DEFAULT 'reporter'::public.user_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.telejornais (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    horario text,
    espelho_aberto boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.blocos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telejornal_id uuid,
    nome text NOT NULL,
    ordem integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

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
    tags text[],
    equipamento text,
    ordem integer NOT NULL,
    horario_exibicao timestamp with time zone,
    is_from_snapshot boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.pautas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    titulo text NOT NULL,
    descricao text,
    local text,
    horario text,
    entrevistado text,
    produtor text,
    proposta text,
    encaminhamento text,
    informacoes text,
    data_cobertura date,
    programa text,
    reporter text,
    status text DEFAULT 'pendente'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.materias_locks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    materia_id uuid NOT NULL,
    user_id uuid NOT NULL,
    locked_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:30:00'::interval),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.espelhos_salvos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    telejornal_id uuid NOT NULL,
    nome text NOT NULL,
    data_referencia date NOT NULL,
    estrutura jsonb NOT NULL,
    data_salvamento timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid
);

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
    tags text[],
    equipamento text,
    ordem integer NOT NULL DEFAULT 1,
    horario_exibicao timestamp with time zone,
    is_snapshot boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    bloco_nome text,
    bloco_ordem integer
);

CREATE TABLE public.modelos_salvos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    estrutura jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add primary keys
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.telejornais ADD CONSTRAINT telejornais_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blocos ADD CONSTRAINT blocos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.materias ADD CONSTRAINT materias_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pautas ADD CONSTRAINT pautas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.materias_locks ADD CONSTRAINT materias_locks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.espelhos_salvos ADD CONSTRAINT espelhos_salvos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.materias_snapshots ADD CONSTRAINT materias_snapshots_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.modelos_salvos ADD CONSTRAINT modelos_salvos_pkey PRIMARY KEY (id);

-- Create database functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role::TEXT, 'reporter') 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_salvos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Editor chefe can view all profiles" ON public.profiles
    FOR SELECT USING (get_current_user_role() = 'editor_chefe');

-- Create RLS Policies for telejornais
CREATE POLICY "Newsroom staff can view telejornais" ON public.telejornais
    FOR SELECT USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])));

CREATE POLICY "Editors can create telejornais" ON public.telejornais
    FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update telejornais" ON public.telejornais
    FOR UPDATE USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete telejornais" ON public.telejornais
    FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Create RLS Policies for blocos
CREATE POLICY "Newsroom staff can view blocos" ON public.blocos
    FOR SELECT USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])));

CREATE POLICY "Editors can create blocos" ON public.blocos
    FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update blocos" ON public.blocos
    FOR UPDATE USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete blocos" ON public.blocos
    FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Create RLS Policies for materias
CREATE POLICY "Newsroom staff can view all materias" ON public.materias
    FOR SELECT USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text, 'produtor'::text])));

CREATE POLICY "Reporters and above can create materias" ON public.materias
    FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])));

CREATE POLICY "Reporters and above can update materias" ON public.materias
    FOR UPDATE USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = ANY (ARRAY['reporter'::text, 'editor'::text, 'editor_chefe'::text])));

CREATE POLICY "Editor chefe can delete materias" ON public.materias
    FOR DELETE USING ((auth.uid() IS NOT NULL) AND (get_current_user_role() = 'editor_chefe'));

-- Create RLS Policies for pautas
CREATE POLICY "Users can view their own pautas" ON public.pautas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Editors can view all pautas" ON public.pautas
    FOR SELECT USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Users can create their own pautas" ON public.pautas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Producers and editor-chefe can create pautas" ON public.pautas
    FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['produtor'::text, 'editor_chefe'::text]));

CREATE POLICY "Users can update their own pautas" ON public.pautas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Editor-chefe can update all pautas" ON public.pautas
    FOR UPDATE USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can delete their own pautas" ON public.pautas
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Editor-chefe can delete all pautas" ON public.pautas
    FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Create RLS Policies for materias_locks
CREATE POLICY "Users can view all materias locks" ON public.materias_locks
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own locks" ON public.materias_locks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locks" ON public.materias_locks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locks" ON public.materias_locks
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for espelhos_salvos
CREATE POLICY "Users can view their own saved rundowns" ON public.espelhos_salvos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can view all saved rundowns" ON public.espelhos_salvos
    FOR SELECT USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can create their own saved rundowns" ON public.espelhos_salvos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved rundowns" ON public.espelhos_salvos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can update all saved rundowns" ON public.espelhos_salvos
    FOR UPDATE USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can delete their own saved rundowns" ON public.espelhos_salvos
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Editor chefe can delete all saved rundowns" ON public.espelhos_salvos
    FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Create RLS Policies for materias_snapshots
CREATE POLICY "Users can view their own snapshots" ON public.materias_snapshots
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Editors can view all snapshots" ON public.materias_snapshots
    FOR SELECT USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Users can create snapshots" ON public.materias_snapshots
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own snapshots" ON public.materias_snapshots
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Editors can update all snapshots" ON public.materias_snapshots
    FOR UPDATE USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Users can delete their own snapshots" ON public.materias_snapshots
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Editor chefe can delete all snapshots" ON public.materias_snapshots
    FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Create RLS Policies for modelos_salvos
CREATE POLICY "Authenticated users can view saved models" ON public.modelos_salvos
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Editors can create saved models" ON public.modelos_salvos
    FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editors can update saved models" ON public.modelos_salvos
    FOR UPDATE USING (get_current_user_role() = ANY (ARRAY['editor'::text, 'editor_chefe'::text]));

CREATE POLICY "Editor chefe can delete saved models" ON public.modelos_salvos
    FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Insert production data
-- Profiles data
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at) VALUES
('b87b65b9-8d3b-446a-a92d-c0d100c45e04', 'leandrovieira007@hotmail.com', 'editor_chefe', '2025-08-25 05:27:23.818594+00', '2025-08-25 05:28:49.392806+00'),
('ff3d523b-6d29-4562-96e2-453e5bca58eb', 'lucassantanarv215@gmail.com', 'editor_chefe', '2025-08-25 13:22:11.019842+00', '2025-08-25 13:25:51.582558+00'),
('b5829546-d401-4516-96ca-ef4ac2398e9e', 'luizboatardegoias@gmail.com', 'editor_chefe', '2025-08-25 13:33:23.267769+00', '2025-08-25 13:33:36.686447+00'),
('12cb1fbb-f782-498b-9933-45fb628ddbc8', 'ferrari.carol@hotmail.com', 'editor', '2025-08-25 13:52:40.763353+00', '2025-08-25 13:56:00.790213+00'),
('2cacc1a5-866f-475b-9c3d-b929ffc43b6b', 'pauloferrari160@gmail.com', 'editor', '2025-08-25 14:08:52.66691+00', '2025-08-25 14:10:05.018569+00'),
('d9ffb204-3580-4345-9d91-8d0cec9c070a', 'rogeriotrovas7@gmail.com', 'reporter', '2025-08-25 14:11:26.738286+00', '2025-08-25 14:11:26.738286+00'),
('6c5e3211-d555-472b-8d90-6e6d63daa74b', 'ellencristinaaa@gmail.com', 'editor', '2025-08-25 14:13:04.39897+00', '2025-08-25 14:14:10.685451+00'),
('27f9aec9-2a63-4e14-b64c-32d190897a6c', 'mkt.arthurpadua@gmail.com', 'editor_chefe', '2025-08-25 14:15:30.316971+00', '2025-08-25 14:20:39.609546+00'),
('4a361a0c-25f5-4796-8b40-f0c3857f35e3', 'fernandodavizinho14@gmail.com', 'reporter', '2025-08-25 14:16:31.626816+00', '2025-08-25 14:16:31.626816+00'),
('1d5c9b28-5cfb-471b-a971-bdb9e6acd62a', 'joseinaciofarias7@gmail.com', 'reporter', '2025-08-25 14:17:39.288354+00', '2025-08-25 14:17:39.288354+00');

-- Telejornais data
INSERT INTO public.telejornais (id, nome, horario, espelho_aberto, created_at, updated_at) VALUES
('0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Boa Tarde(LEANDRO)', '', true, '2025-08-25 06:17:00.80635+00', '2025-09-01 10:32:25.977921+00'),
('e658801a-a65d-46d4-956c-854da3933e57', 'TESTE (equipe newsroomate)', '', true, '2025-08-26 22:15:44.657088+00', '2025-08-29 04:23:34.595068+00'),
('9966841c-a257-4bf7-8393-5e777bb65a6b', 'ESPECIAIS', '', true, '2025-08-27 00:11:23.404191+00', '2025-08-27 00:12:15.838819+00'),
('e6a21e41-15fd-469f-a433-e1ac4b50fe13', 'GRAVADOS', '', false, '2025-08-27 17:02:38.655987+00', '2025-08-29 13:40:20.54981+00'),
('0eca78c6-e40d-46ab-abd3-6aa1904e97f6', 'GRAVADOS', '', false, '2025-08-27 17:40:39.940963+00', '2025-08-27 17:40:39.940963+00'),
('323547f0-d354-4d0e-8231-f32333f60a39', 'BOA TARDE COM LEANDRO VIEIRA', '12:00', true, '2025-09-01 10:33:26.957976+00', '2025-09-01 10:33:39.312706+00');

-- Blocos data
INSERT INTO public.blocos (id, telejornal_id, nome, ordem, created_at, updated_at) VALUES
('eb07825c-d46c-4002-b045-6a585e720c92', '0eca78c6-e40d-46ab-abd3-6aa1904e97f6', 'Bloco 1', 1, '2025-08-27 17:40:54.212709+00', '2025-08-27 17:40:54.212709+00'),
('fec1b44c-3609-48c6-942d-dae4f75b5252', '0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Bloco 1', 1, '2025-08-28 10:19:36.839514+00', '2025-08-28 10:19:36.839514+00'),
('2db6b146-0876-4c2b-a679-c4aac6182820', '0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Bloco 2', 2, '2025-08-28 11:14:32.866446+00', '2025-08-28 11:14:32.866446+00'),
('a5390200-21a3-40a2-b639-e7e4bb9d8231', '0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Bloco 3', 2, '2025-08-28 11:15:30.649711+00', '2025-08-28 11:24:41.085804+00'),
('07b9a80a-eebb-4fbd-94e1-e6a0db769a10', '0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Bloco 4', 4, '2025-09-01 10:33:17.654999+00', '2025-09-01 10:33:17.654999+00'),
('1abe9180-4f17-4376-895e-1b418c8bc658', '323547f0-d354-4d0e-8231-f32333f60a39', 'Bloco 1', 1, '2025-09-01 10:33:35.939564+00', '2025-09-01 10:33:35.939564+00'),
('f9844ca4-1c9b-450b-a295-1edc800d317a', '323547f0-d354-4d0e-8231-f32333f60a39', 'Bloco 2', 2, '2025-09-01 10:36:37.624407+00', '2025-09-01 10:36:37.624407+00'),
('705f1125-7bc5-4e84-b0fb-ba42155375b8', '323547f0-d354-4d0e-8231-f32333f60a39', 'Bloco 3', 3, '2025-09-01 11:58:31.374915+00', '2025-09-01 11:58:31.374915+00'),
('8d263a22-7f83-4d97-a9c9-9b18c06dcb87', '323547f0-d354-4d0e-8231-f32333f60a39', 'Bloco 3', 3, '2025-09-01 12:32:02.881775+00', '2025-09-01 12:32:02.881775+00'),
('7c5e264a-11cb-40b1-9e58-2d626d4f03e6', '9966841c-a257-4bf7-8393-5e777bb65a6b', 'Bloco 1', 1, '2025-08-27 00:12:25.5105+00', '2025-08-27 00:12:25.5105+00'),
('53d5c1dd-d2c1-4c5f-a412-791c93287690', '9966841c-a257-4bf7-8393-5e777bb65a6b', 'Bloco 1', 1, '2025-08-27 00:12:06.233072+00', '2025-08-27 00:12:06.233072+00'),
('07e9596c-a922-472c-8779-e543f21c4c88', '9966841c-a257-4bf7-8393-5e777bb65a6b', 'Bloco 2', 2, '2025-08-27 00:12:26.222434+00', '2025-08-27 00:12:26.222434+00'),
('2c14a06d-6cd0-4332-b207-383eabef2c1d', '9966841c-a257-4bf7-8393-5e777bb65a6b', 'STAND BY', 3, '2025-08-27 00:12:27.038343+00', '2025-08-27 00:12:27.038343+00'),
('035e1408-76b3-41d4-9329-16e7b8033888', 'e658801a-a65d-46d4-956c-854da3933e57', 'Bloco 1', 1, '2025-08-29 04:29:14.295759+00', '2025-08-29 04:29:14.295759+00'),
('5c09919c-39aa-4801-8519-6e3ca3c4a406', 'e658801a-a65d-46d4-956c-854da3933e57', 'STAND BY', 3, '2025-08-29 04:29:17.438747+00', '2025-08-29 04:29:17.438747+00'),
('296974c0-c8c6-40b1-ab82-730bc490bec2', 'e6a21e41-15fd-469f-a433-e1ac4b50fe13', 'Bloco 1', 1, '2025-08-27 17:04:53.769704+00', '2025-08-27 17:04:53.769704+00'),
('a928d943-74de-4282-8d27-ed6107de6b20', 'e6a21e41-15fd-469f-a433-e1ac4b50fe13', 'Bloco 2', 2, '2025-08-27 17:49:14.279532+00', '2025-08-27 17:49:14.279532+00'),
('22e4ceb0-bab0-403b-8d84-a992f12f006a', 'e6a21e41-15fd-469f-a433-e1ac4b50fe13', 'Standby', 3, '2025-08-28 12:17:20.644972+00', '2025-08-28 12:17:38.680881+00');

-- Pautas data
INSERT INTO public.pautas (id, user_id, titulo, descricao, local, horario, entrevistado, produtor, proposta, encaminhamento, informacoes, data_cobertura, programa, reporter, status, created_at, updated_at) VALUES
('7ac7715b-2950-453f-b9a9-b4e492d29ffc', 'ff3d523b-6d29-4562-96e2-453e5bca58eb', 'HISTÓRIA COLÉGIO DO SOL', '', 'R. Augusta Bastos - Centro, Rio Verde - GO, 75900-030', '14:30', 'ELIENE SENE - DIRETORA DA ESCOLA', 'LUCAS SANTANA', null, null, null, null, null, null, 'pendente', '2025-08-25 16:07:49.240294+00', '2025-08-25 16:08:38.580719+00'),
('6bfbf0a0-9e2c-42a0-b8a0-721e636b194d', 'ff3d523b-6d29-4562-96e2-453e5bca58eb', 'RONALDINHO FIGURA RVD', '', '', '16:00', 'RONALDINHO', 'ELLEN', null, null, null, null, null, null, 'pendente', '2025-08-25 16:37:22.116984+00', '2025-08-25 16:37:22.116984+00'),
('944b1538-13d4-4dc5-b6bc-b4712f95a0c3', 'ff3d523b-6d29-4562-96e2-453e5bca58eb', 'RUA SÓ O AMOR CONSTROI', '', '', '', 'Júlio Gomes, André Andrade', '', '', '', '', null, null, null, 'pendente', '2025-08-25 16:58:03.261861+00', '2025-08-26 06:37:00.067374+00'),
('7eeb8f70-47ef-46dc-bd0a-0300e73f9ba8', '6c5e3211-d555-472b-8d90-6e6d63daa74b', 'ANIMAIS SILVESTRES EM CASA', 'O Ibama alerta que a criação de animais silvestres em ambiente doméstico só é permitida mediante regras específicas. No caso das serpentes, apenas espécies não venenosas podem ser adquiridas em criadouros autorizados e acompanhadas de protocolo de segurança para manuseio e adaptação do ambiente. Já as cobras peçonhentas, como a naja encontrada no Distrito Federal após picar um estudante, só podem ser mantidas em locais habilitados, como centros de pesquisa ou pela indústria farmacêutica.', 'Organizar em uma casa, praça ou no veterinário.', '', 'Junior - veterinário e cuidador.', 'Ellen Nascimento', '', '', 'Dr. Osmar Junior (64) 9 9934-3671', null, null, null, 'pendente', '2025-08-26 12:11:53.135096+00', '2025-08-26 12:11:53.135096+00');

-- Sample materias data (first 5 records to complete the structure)
INSERT INTO public.materias (id, bloco_id, retranca, clip, tempo_clip, duracao, pagina, reporter, status, texto, cabeca, gc, tipo_material, local_gravacao, tags, equipamento, ordem, horario_exibicao, is_from_snapshot, created_at, updated_at) VALUES
('1dadfb27-4c96-4011-aa74-cdddb47dea0a', '035e1408-76b3-41d4-9329-16e7b8033888', 'ABERTURA DO PROGRAMA', 'VINHETA', null, 10, '1', '', 'approved', '', 'SEJA BEM VINDO AO NEWSROOMATE/ HOJE NOSSA EQUIPE VAI TE MOSTRAR COMO CONECTAR A REDAÇÃO, REPÓRTERES E APRESENTADORES COM OS FATOS COM O MELHOR SISTEMA', 'NEWSROOMATE| A EVOLUÇÃO DA SUA REDAÇÃO', 'VHT', '', null, null, 1, null, false, '2025-08-29 04:29:14.467226+00', '2025-09-01 21:54:52.591489+00'),
('cd352d9e-1e05-4bc1-8d48-d1f76afd0a97', '035e1408-76b3-41d4-9329-16e7b8033888', 'DESTAQUES DO PROGRAMA', 'TESTE_ESCALADA', null, 3, '2', 'TODOS', 'approved', '', 'E VAMOS COM OS DESTAQUES DO SISTEMA', 'DESTAQUES DO SISTEMA| 100% SAS - NÃO OCUPA ESPAÇO NOS HDs DA REDAÇÃO MULTIPLATAFORMA - TABLETS E CELULARES PODEM SER USADOS EM EXTERNAS', 'EST', '', null, null, 2, null, false, '2025-08-29 04:29:14.56148+00', '2025-09-01 01:29:12.854632+00'),
('9bfe8a4d-84c5-4b50-99a3-2d414f50ea81', '035e1408-76b3-41d4-9329-16e7b8033888', 'EUA-CHINA', 'IMG_ACORDO', null, 6, '6', 'ALBERTO ROBERTO', 'approved', 'a Polícia Civil de Goiás, por meio da Delegacia de Morrinhos (19ª DRP), deflagrou uma operação que resultou na apreensão de entorpecentes, materiais usados no tráfico de drogas e no resgate de 17 galos mantidos em condições insalubres.', 'POLÍCIA CIVIL C APREENDE DROGAS E RESGATA 17 GALOS VÍTIMAS DE MAUS-TRATOS. // ELLEN NASCIMENTO', 'DROGAS E MAUS-TRATOS| materiais de tráfico e 17 galos mantidos em condições precárias foram encontrados', 'LINK', '', null, null, 3, null, false, '2025-08-29 04:29:15.134027+00', '2025-09-01 01:32:25.849979+00'),
('5258cc93-ca31-43c6-8cb3-b7c4a767f196', '035e1408-76b3-41d4-9329-16e7b8033888', 'ACIDENTE SÃO PAULO', 'ACIDENTE SP', null, 8, '3', 'MILTON NASCIMENTO', 'review', '', 'UM GRAVE ACIDENTE DE TRÂNSITO ACONTECEU AGORA PELA MANHÃ NO CENTRO DE SÃO PAULO/VÍTIMAS GRAVES FORAM SOCORRIDAS DE HELICÓPTERO///(VT_SEBASTIÃO LIMA)', 'SOCORRIDAS DE HELICÓPTERO|', 'VT', '', null, null, 4, null, false, '2025-08-29 04:29:14.651029+00', '2025-09-01 01:33:08.253362+00'),
('563c6e21-2cdd-401f-8050-1c782350d355', '035e1408-76b3-41d4-9329-16e7b8033888', 'CARRO APP', 'IMG_CARRO APP', null, 14, '4', 'IVETE SEM GALO', 'draft', 'Passageiro bêbado agride motorista de aplicativo após vomitar no carro e se recusar a pagar limpeza em MG', 'MOTORISTA DE APLICATIVO É AGREDIDO POR PASSAGEIRO BÊBADO EM UBERLÂNDIA. /// O HOMEM VOMITOU NO CARRO,/  SE RECUSOU A PAGAR A LIMPEZA / E PARTIU PARA A VIOLÊNCIA. ///TUDO FOI REGISTRADO EM VÍDEO. // (REPORTAGEM FERNANDO)', 'BEBEU, VOMITOU E PARTIU PRA VIOLÊNCIA motorista de aplicativo é agredido durante corrida', '', null, null, 5, null, false, '2025-08-29 04:29:14.753248+00', '2025-09-01 01:33:08.253362+00');

-- Espelhos salvos data
INSERT INTO public.espelhos_salvos (id, telejornal_id, nome, data_referencia, estrutura, data_salvamento, created_at, updated_at, user_id) VALUES
('6abb0f87-5e32-41c7-8e4c-55c3638009a9', '0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Boa Tarde(LEANDRO)', '2025-08-25', '{"blocos": [{"id": "3da9675c-7c98-422e-b046-4a2db03a6023", "items": [{"cabeca": "testando...", "clip": "", "duracao": 0, "equipamento": null, "gc": "TESTANDO GC...", "horario_exibicao": null, "id": "03fd5791-67f6-45bd-94fa-a757a1ad7dd6", "local_gravacao": "", "ordem": 1, "pagina": "1", "reporter": "", "retranca": "TESTE TESTE", "status": "draft", "tags": null, "tempo_clip": null, "texto": "", "tipo_material": null}], "nome": "Bloco 1", "ordem": 1}]}', '2025-08-25 06:28:32.446343+00', '2025-08-25 06:28:32.446343+00', '2025-08-25 06:28:32.446343+00', 'b87b65b9-8d3b-446a-a92d-c0d100c45e04'),
('5cf63b0f-df9e-4e4a-945a-a45d05924bf3', '0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Boa Tarde(LEANDRO)', '2025-08-25', '{"blocos": [{"id": "75361817-3c08-4afd-9171-c95419fbd78d", "items": [], "nome": "Bloco 1", "ordem": 1}]}', '2025-08-25 13:11:19.202235+00', '2025-08-25 13:11:19.202235+00', '2025-08-25 13:11:19.202235+00', 'b87b65b9-8d3b-446a-a92d-c0d100c45e04');

-- Modelos salvos data
INSERT INTO public.modelos_salvos (id, nome, descricao, estrutura, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Modelo Padrão Boa Tarde', 'Estrutura padrão para o programa Boa Tarde com blocos pré-definidos', '{"blocos": [{"id": "35efc4e2-b5f8-4c08-8a9d-b3dbd19a122d", "items": [{"cabeca": "CHAMA DESTAQUES DOS REPÓRTERES AO VIVO", "clip": "", "duracao": 2, "gc": "DESTAQUES DO BOA TARDE DESTA SEGUNDA-FEIRA", "id": "7315091c-7883-4df5-85aa-6963ac4159e5", "ordem": 1, "pagina": "1", "reporter": "APRESENTADOR", "retranca": "DESTAQUES REPÓRTERES AO VIVO", "status": "approved", "texto": ""}], "nome": "Bloco 1", "ordem": 1}]}', '2025-08-25 14:13:05.510794+00', '2025-08-25 14:13:05.510794+00');

-- Enable realtime for all tables
SELECT public.enable_realtime('profiles');
SELECT public.enable_realtime('telejornais');
SELECT public.enable_realtime('blocos');
SELECT public.enable_realtime('materias');
SELECT public.enable_realtime('pautas');
SELECT public.enable_realtime('materias_locks');
SELECT public.enable_realtime('espelhos_salvos');
SELECT public.enable_realtime('materias_snapshots');
SELECT public.enable_realtime('modelos_salvos');

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER update_materias_snapshots_updated_at
    BEFORE UPDATE ON public.materias_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modelos_salvos_updated_at
    BEFORE UPDATE ON public.modelos_salvos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Final success message
SELECT 'DUMP COMPLETO CRIADO COM SUCESSO! ✅' as status;