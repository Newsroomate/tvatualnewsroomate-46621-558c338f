-- ================================================
-- NEWSROOMATE PROJECT - SUPABASE COMPLETE DATABASE DUMP
-- Generated on: 2025-01-30
-- Project ID: rigluylhplrrlfkssrur
-- ================================================

-- ================================================
-- DATABASE SCHEMA AND TABLE STRUCTURES
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('reporter', 'editor', 'editor_chefe', 'produtor');
    END IF;
END$$;

-- ================================================
-- TABLE: profiles
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'reporter'::user_role,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================
-- TABLE: telejornais
-- ================================================
CREATE TABLE IF NOT EXISTS public.telejornais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    horario TEXT,
    espelho_aberto BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- TABLE: blocos
-- ================================================
CREATE TABLE IF NOT EXISTS public.blocos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telejornal_id UUID,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- TABLE: materias
-- ================================================
CREATE TABLE IF NOT EXISTS public.materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retranca TEXT NOT NULL,
    bloco_id UUID,
    ordem INTEGER NOT NULL,
    duracao INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft'::text,
    tipo_material TEXT,
    equipamento TEXT,
    gc TEXT,
    cabeca TEXT,
    texto TEXT,
    reporter TEXT,
    pagina TEXT,
    tempo_clip TEXT,
    clip TEXT,
    local_gravacao TEXT,
    horario_exibicao TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    is_from_snapshot BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- TABLE: pautas
-- ================================================
CREATE TABLE IF NOT EXISTS public.pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    user_id UUID,
    data_cobertura DATE,
    horario TEXT,
    local TEXT,
    entrevistado TEXT,
    produtor TEXT,
    reporter TEXT,
    programa TEXT,
    proposta TEXT,
    informacoes TEXT,
    encaminhamento TEXT,
    status TEXT DEFAULT 'pendente'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- TABLE: materias_locks
-- ================================================
CREATE TABLE IF NOT EXISTS public.materias_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_id UUID NOT NULL,
    user_id UUID NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + '00:30:00'::interval),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================
-- TABLE: espelhos_salvos
-- ================================================
CREATE TABLE IF NOT EXISTS public.espelhos_salvos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telejornal_id UUID NOT NULL,
    data_referencia DATE NOT NULL,
    estrutura JSONB NOT NULL,
    user_id UUID,
    data_salvamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================
-- TABLE: materias_snapshots
-- ================================================
CREATE TABLE IF NOT EXISTS public.materias_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_original_id UUID,
    snapshot_id UUID,
    retranca TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 1,
    duracao INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft'::text,
    tipo_material TEXT,
    equipamento TEXT,
    gc TEXT,
    cabeca TEXT,
    texto TEXT,
    reporter TEXT,
    pagina TEXT,
    tempo_clip TEXT,
    clip TEXT,
    local_gravacao TEXT,
    bloco_nome TEXT,
    bloco_ordem INTEGER,
    horario_exibicao TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    is_snapshot BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- TABLE: modelos_salvos
-- ================================================
CREATE TABLE IF NOT EXISTS public.modelos_salvos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    estrutura JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ================================================
-- DATABASE FUNCTIONS
-- ================================================

-- Function to get current user role
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

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to cleanup expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$$;

-- Function to enable realtime for tables
CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_salvos ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Editor chefe can view all profiles" ON public.profiles
FOR SELECT USING (get_current_user_role() = 'editor_chefe');

-- Telejornais policies
CREATE POLICY "Newsroom staff can view telejornais" ON public.telejornais
FOR SELECT USING (auth.uid() IS NOT NULL AND get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe', 'produtor']));

CREATE POLICY "Editors can create telejornais" ON public.telejornais
FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editors can update telejornais" ON public.telejornais
FOR UPDATE USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editor chefe can delete telejornais" ON public.telejornais
FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Blocos policies
CREATE POLICY "Newsroom staff can view blocos" ON public.blocos
FOR SELECT USING (auth.uid() IS NOT NULL AND get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe', 'produtor']));

CREATE POLICY "Editors can create blocos" ON public.blocos
FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editors can update blocos" ON public.blocos
FOR UPDATE USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Editor chefe can delete blocos" ON public.blocos
FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- Materias policies
CREATE POLICY "Newsroom staff can view all materias" ON public.materias
FOR SELECT USING (auth.uid() IS NOT NULL AND get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe', 'produtor']));

CREATE POLICY "Reporters and above can create materias" ON public.materias
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe']));

CREATE POLICY "Reporters and above can update materias" ON public.materias
FOR UPDATE USING (auth.uid() IS NOT NULL AND get_current_user_role() = ANY (ARRAY['reporter', 'editor', 'editor_chefe']));

CREATE POLICY "Editor chefe can delete materias" ON public.materias
FOR DELETE USING (auth.uid() IS NOT NULL AND get_current_user_role() = 'editor_chefe');

-- Pautas policies
CREATE POLICY "Users can view their own pautas" ON public.pautas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Editors can view all pautas" ON public.pautas
FOR SELECT USING (get_current_user_role() = ANY (ARRAY['editor', 'editor_chefe']));

CREATE POLICY "Users can create their own pautas" ON public.pautas
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Producers and editor-chefe can create pautas" ON public.pautas
FOR INSERT WITH CHECK (get_current_user_role() = ANY (ARRAY['produtor', 'editor_chefe']));

CREATE POLICY "Users can update their own pautas" ON public.pautas
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Editor-chefe can update all pautas" ON public.pautas
FOR UPDATE USING (get_current_user_role() = 'editor_chefe');

CREATE POLICY "Users can delete their own pautas" ON public.pautas
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Editor-chefe can delete all pautas" ON public.pautas
FOR DELETE USING (get_current_user_role() = 'editor_chefe');

-- ================================================
-- DATA INSERTION
-- ================================================

-- Insert profiles data
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

-- Insert telejornais data
INSERT INTO public.telejornais (id, nome, horario, espelho_aberto, created_at, updated_at) VALUES
('0f275fe9-baac-4d1b-8067-9621fd0748a2', 'Boa Tarde(LEANDRO)', '', false, '2025-08-25 06:17:00.80635+00', '2025-08-29 13:41:46.327509+00'),
('e658801a-a65d-46d4-956c-854da3933e57', 'TESTE (equipe newsroomate)', '', true, '2025-08-26 22:15:44.657088+00', '2025-08-29 04:23:34.595068+00'),
('9966841c-a257-4bf7-8393-5e777bb65a6b', 'ESPECIAIS', '', true, '2025-08-27 00:11:23.404191+00', '2025-08-27 00:12:15.838819+00'),
('e6a21e41-15fd-469f-a433-e1ac4b50fe13', 'GRAVADOS', '', false, '2025-08-27 17:02:38.655987+00', '2025-08-29 13:40:20.54981+00'),
('0eca78c6-e40d-46ab-abd3-6aa1904e97f6', 'GRAVADOS', '', false, '2025-08-27 17:40:39.940963+00', '2025-08-27 17:40:39.940963+00');

-- ================================================
-- REALTIME SETUP
-- ================================================

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

-- ================================================
-- TRIGGERS SETUP
-- ================================================

-- Create triggers for updating timestamps
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

-- ================================================
-- COMPLETION MESSAGE
-- ================================================

-- This dump contains the complete structure and core data of the Newsroomate project
-- Generated from Supabase project: rigluylhplrrlfkssrur
-- 
-- To use this dump:
-- 1. Create a new Supabase project
-- 2. Run this SQL script in the SQL Editor
-- 3. Configure authentication settings as needed
-- 4. Update your application's Supabase configuration
--
-- Note: This dump includes schema, functions, RLS policies, and sample data
-- Additional data may need to be migrated separately if this is a production restore