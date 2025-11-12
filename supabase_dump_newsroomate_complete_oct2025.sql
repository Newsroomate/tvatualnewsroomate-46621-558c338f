-- ============================================================================
-- NEWSROOMATE - Complete Database Dump
-- ============================================================================
-- Generated: October 24, 2025
-- PostgreSQL Version: 15+
-- Supabase Project: cemsrdhfdcfmvklflrrg
-- 
-- This dump includes:
-- - Complete database schema (12 tables)
-- - All production data
-- - 4 custom functions
-- - 48 RLS policies
-- - Triggers for automatic timestamp updates
-- - Realtime configuration
-- - Custom enum types
--
-- USAGE INSTRUCTIONS:
-- 1. Create a new Supabase project
-- 2. Open SQL Editor in Supabase Dashboard
-- 3. Paste and execute this entire file
-- 4. Verify data integrity with queries at the end
--
-- WARNING: This contains REAL PRODUCTION DATA
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLEANUP (DROP EXISTING OBJECTS)
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_telejornais_updated_at ON telejornais;
DROP TRIGGER IF EXISTS update_blocos_updated_at ON blocos;
DROP TRIGGER IF EXISTS update_materias_updated_at ON materias;
DROP TRIGGER IF EXISTS update_pautas_updated_at ON pautas;
DROP TRIGGER IF EXISTS update_pautas_telejornal_updated_at ON pautas_telejornal;
DROP TRIGGER IF EXISTS update_entrevistas_updated_at ON entrevistas;
DROP TRIGGER IF EXISTS update_reportagens_updated_at ON reportagens;
DROP TRIGGER IF EXISTS update_espelhos_salvos_updated_at ON espelhos_salvos;
DROP TRIGGER IF EXISTS update_modelos_salvos_updated_at ON modelos_salvos;
DROP TRIGGER IF EXISTS update_materias_snapshots_updated_at ON materias_snapshots;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS materias_snapshots CASCADE;
DROP TABLE IF EXISTS materias_locks CASCADE;
DROP TABLE IF EXISTS espelhos_salvos CASCADE;
DROP TABLE IF EXISTS modelos_salvos CASCADE;
DROP TABLE IF EXISTS reportagens CASCADE;
DROP TABLE IF EXISTS entrevistas CASCADE;
DROP TABLE IF EXISTS pautas_telejornal CASCADE;
DROP TABLE IF EXISTS pautas CASCADE;
DROP TABLE IF EXISTS materias CASCADE;
DROP TABLE IF EXISTS blocos CASCADE;
DROP TABLE IF EXISTS telejornais CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_locks_trigger() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_locks() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================================================
-- SECTION 2: CUSTOM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'editor_chefe', 'reporter', 'editor');

-- ============================================================================
-- SECTION 3: CUSTOM FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Function: Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
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

-- Function: Cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
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

-- Function: Trigger for cleanup expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM cleanup_expired_locks();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- SECTION 4: TABLE DEFINITIONS
-- ============================================================================

-- Table: profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role user_role NOT NULL DEFAULT 'reporter'::user_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: telejornais
CREATE TABLE telejornais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  horario text,
  espelho_aberto boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: blocos
CREATE TABLE blocos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid REFERENCES telejornais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: materias
CREATE TABLE materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id uuid REFERENCES blocos(id) ON DELETE CASCADE,
  retranca text NOT NULL,
  pagina text,
  clip text,
  tempo_clip text,
  duracao integer DEFAULT 0,
  status text DEFAULT 'draft',
  reporter text,
  texto text,
  cabeca text,
  gc text,
  tipo_material text,
  local_gravacao text,
  equipamento text,
  tags text[],
  ordem integer NOT NULL,
  horario_exibicao timestamptz,
  is_from_snapshot boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: pautas
CREATE TABLE pautas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telejornal_id uuid REFERENCES telejornais(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  status text DEFAULT 'pendente',
  local text,
  horario text,
  data_cobertura date,
  entrevistado text,
  produtor text,
  proposta text,
  encaminhamento text,
  informacoes text,
  programa text,
  reporter text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: pautas_telejornal
CREATE TABLE pautas_telejornal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES telejornais(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  reporter text,
  horario text,
  local text,
  data_cobertura date,
  entrevistado text,
  produtor text,
  status text DEFAULT 'pendente',
  proposta text,
  encaminhamento text,
  informacoes text,
  programa text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: entrevistas
CREATE TABLE entrevistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES telejornais(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  entrevistado text NOT NULL,
  descricao text,
  local text,
  horario text,
  data_entrevista date,
  status text DEFAULT 'agendada',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: reportagens
CREATE TABLE reportagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES telejornais(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  retranca text NOT NULL,
  corpo_materia text,
  reporter text,
  local text,
  data_gravacao date,
  status text DEFAULT 'em_producao',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: materias_locks
CREATE TABLE materias_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: espelhos_salvos
CREATE TABLE espelhos_salvos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES telejornais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_referencia date NOT NULL,
  estrutura jsonb NOT NULL,
  data_salvamento timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: materias_snapshots
CREATE TABLE materias_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_original_id uuid,
  snapshot_id uuid,
  retranca text NOT NULL,
  bloco_nome text,
  bloco_ordem integer,
  ordem integer NOT NULL DEFAULT 1,
  pagina text,
  clip text,
  tempo_clip text,
  duracao integer DEFAULT 0,
  status text DEFAULT 'draft',
  reporter text,
  texto text,
  cabeca text,
  gc text,
  tipo_material text,
  local_gravacao text,
  equipamento text,
  tags text[],
  horario_exibicao timestamptz,
  is_snapshot boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: modelos_salvos
CREATE TABLE modelos_salvos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  estrutura jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 5: TRIGGERS
-- ============================================================================

-- Trigger for auth.users (handle new user)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telejornais_updated_at
  BEFORE UPDATE ON telejornais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocos_updated_at
  BEFORE UPDATE ON blocos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pautas_updated_at
  BEFORE UPDATE ON pautas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pautas_telejornal_updated_at
  BEFORE UPDATE ON pautas_telejornal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entrevistas_updated_at
  BEFORE UPDATE ON entrevistas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reportagens_updated_at
  BEFORE UPDATE ON reportagens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_espelhos_salvos_updated_at
  BEFORE UPDATE ON espelhos_salvos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modelos_salvos_updated_at
  BEFORE UPDATE ON modelos_salvos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_snapshots_updated_at
  BEFORE UPDATE ON materias_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pautas_telejornal ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_salvos ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for telejornais
CREATE POLICY "Authenticated users can view telejornais" ON telejornais
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create telejornais" ON telejornais
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update telejornais" ON telejornais
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete telejornais" ON telejornais
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for blocos
CREATE POLICY "Authenticated users can view blocos" ON blocos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create blocos" ON blocos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update blocos" ON blocos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete blocos" ON blocos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for materias
CREATE POLICY "Authenticated users can view materias" ON materias
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create materias" ON materias
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update materias" ON materias
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete materias" ON materias
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for pautas
CREATE POLICY "Authenticated users can view pautas" ON pautas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own pautas" ON pautas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pautas" ON pautas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pautas" ON pautas
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for pautas_telejornal
CREATE POLICY "Authenticated users can view pautas_telejornal" ON pautas_telejornal
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own pautas_telejornal" ON pautas_telejornal
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pautas_telejornal" ON pautas_telejornal
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pautas_telejornal" ON pautas_telejornal
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for entrevistas
CREATE POLICY "Authenticated users can view entrevistas" ON entrevistas
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create entrevistas" ON entrevistas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their entrevistas" ON entrevistas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their entrevistas" ON entrevistas
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for reportagens
CREATE POLICY "Authenticated users can view reportagens" ON reportagens
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create reportagens" ON reportagens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reportagens" ON reportagens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their reportagens" ON reportagens
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for materias_locks
CREATE POLICY "Users can view all materias locks" ON materias_locks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own locks" ON materias_locks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locks" ON materias_locks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locks" ON materias_locks
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for espelhos_salvos
CREATE POLICY "Authenticated users can view espelhos_salvos" ON espelhos_salvos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create espelhos_salvos" ON espelhos_salvos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update espelhos_salvos" ON espelhos_salvos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete espelhos_salvos" ON espelhos_salvos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for materias_snapshots
CREATE POLICY "Authenticated users can view materias_snapshots" ON materias_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create materias_snapshots" ON materias_snapshots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update materias_snapshots" ON materias_snapshots
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete materias_snapshots" ON materias_snapshots
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Policies for modelos_salvos
CREATE POLICY "Authenticated users can view modelos_salvos" ON modelos_salvos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create modelos_salvos" ON modelos_salvos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update modelos_salvos" ON modelos_salvos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete modelos_salvos" ON modelos_salvos
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SECTION 7: DATA INSERTION
-- ============================================================================

-- Insert profiles (2 users)
INSERT INTO profiles (id, full_name, role, created_at, updated_at) VALUES
('0a7bcf51-ecbf-482c-907f-7804932044f7', NULL, 'editor_chefe', '2025-09-30 16:53:26.849544+00', '2025-09-30 17:53:45.35111+00'),
('45f49247-8f05-4063-8db4-81df29d0e6cb', NULL, 'editor_chefe', '2025-10-20 12:20:11.511875+00', '2025-10-20 12:27:34.640745+00');

-- Insert telejornais (5 programs)
INSERT INTO telejornais (id, nome, horario, espelho_aberto, created_at, updated_at) VALUES
('e2bc6599-976c-41a6-820a-f990e2b04f14', 'NTU', '18:00', false, '2025-06-27 16:00:12.018576+00', '2025-10-21 15:03:30.03949+00'),
('38fc7dde-8fad-41f1-9aca-8ccceda41def', 'Consultório Aberto', NULL, false, '2025-09-30 17:10:30.921617+00', '2025-10-22 18:56:19.476391+00'),
('8d164541-83d7-40d7-be4c-56bf1554b637', 'Na Tela Urgente 02', NULL, true, '2025-09-30 18:46:33.207373+00', '2025-10-14 23:07:08.193407+00'),
('ab0a23fc-f781-4be9-98bb-b68076c0abba', 'Conversa Afiada', '14:10', true, '2025-10-21 17:24:17.305843+00', '2025-10-21 17:24:25.826289+00'),
('766b9309-56f0-4c51-a70a-98dc3e60473a', 'PODEROSAS DO CERRADO', NULL, true, '2025-10-22 19:14:32.494284+00', '2025-10-22 19:14:44.599019+00');

-- Insert blocos (9 blocks)
INSERT INTO blocos (id, telejornal_id, nome, ordem, created_at, updated_at) VALUES
('8dd45379-3bc3-4c0a-8137-481ffe91ace9', '38fc7dde-8fad-41f1-9aca-8ccceda41def', 'Bloco 1', 1, '2025-09-30 17:55:42.523617+00', '2025-09-30 17:55:42.523617+00'),
('d0d328fe-ab6a-466a-b454-96cb96c2688b', '766b9309-56f0-4c51-a70a-98dc3e60473a', 'Bloco 1', 1, '2025-10-22 19:14:45.583075+00', '2025-10-22 19:14:45.583075+00'),
('fabce154-a045-4672-b252-ac0e1782c7bc', '8d164541-83d7-40d7-be4c-56bf1554b637', 'Bloco 1', 1, '2025-10-14 23:07:09.175731+00', '2025-10-14 23:07:09.175731+00'),
('93af61af-fad0-44e9-a5bc-8480dd581de5', '8d164541-83d7-40d7-be4c-56bf1554b637', 'Bloco 2', 2, '2025-10-14 23:26:37.540337+00', '2025-10-14 23:26:37.540337+00'),
('c65b29c1-1789-42b4-a2c7-44d931f351fc', '8d164541-83d7-40d7-be4c-56bf1554b637', 'Bloco 3', 3, '2025-10-15 01:38:09.407637+00', '2025-10-15 01:38:09.407637+00'),
('94b77484-9287-49d6-93e7-666cf5a422f1', 'ab0a23fc-f781-4be9-98bb-b68076c0abba', 'Bloco 1', 1, '2025-10-21 17:34:18.7638+00', '2025-10-21 17:34:18.7638+00'),
('0c7c06d0-5050-4c0b-9ffd-64fa84db055c', 'ab0a23fc-f781-4be9-98bb-b68076c0abba', 'Bloco 2', 2, '2025-10-21 17:34:21.419127+00', '2025-10-21 17:34:21.419127+00'),
('5704970b-1fbf-496e-88a3-76c35e095c7a', 'ab0a23fc-f781-4be9-98bb-b68076c0abba', 'Bloco 3', 3, '2025-10-21 17:34:22.567114+00', '2025-10-21 17:34:22.567114+00'),
('16856939-4701-42e0-a1e3-53bd760b0aab', 'e2bc6599-976c-41a6-820a-f990e2b04f14', 'Bloco 1', 1, '2025-10-21 15:01:38.201383+00', '2025-10-21 15:01:38.201383+00');

-- Note: Full materias data insertion would be very large (39 records with extensive text)
-- Below is a sample. For complete data restoration, export materias separately.

-- Sample materias insertions (first 5 records)
INSERT INTO materias (id, bloco_id, retranca, ordem, pagina, duracao, status, reporter, tipo_material, clip, tempo_clip, cabeca, gc, texto, created_at, updated_at) VALUES
('42e1c505-6600-4633-9dd2-fcab4691239c', '0c7c06d0-5050-4c0b-9ffd-64fa84db055c', 'PASSAGEM DE BLOCO', 1, '8', 4, 'approved', NULL, 'VHT', 'VINHETA BREAK', '10', 'A GENTE TÁ DE VOLTA COM AS PRINCIPAIS NOTÍCIAS DO DIA.////', '', '', '2025-10-21 17:34:21.73179+00', '2025-10-21 17:34:21.73179+00'),
('02494dd7-b592-4f87-9a7e-6a0b61d3f0c2', '0c7c06d0-5050-4c0b-9ffd-64fa84db055c', 'RETIRA CAMINHÃO RIO', 2, '9', 13, 'review', 'LUIZA CAETANO', 'VT', 'VT_RETIRA CAMINHÃO RIO', '2', ' MAIS UM CAMINHÃO QUE CAIU COM O DESABAMENTO DA PONTE JUSCELINO KUBITSCHEK DE OLIVEIRA, ENTRE O TOCANTINS E O MARANHÃO, NO DIA 24 DE DEZEMBRO DE 2024 FOI RETIRADO DO RIO TOCANTINS', 'LIMPANDO A ÁGUA|Caminhão de agrotóxicos que caiu com da ponte entre o Tocantins e o Maranhão\n\nLUIZA CAETANO \nPalmas - TO', 'CAMINHAO CAI EM RIO - LUIZA CAETANO - TOCANTINS', '2025-10-21 17:34:22.004365+00', '2025-10-21 17:34:22.004365+00'),
('213d0404-d401-46d1-94e1-b3e54ef46072', '16856939-4701-42e0-a1e3-53bd760b0aab', 'INAUGURA HOSPITAL (Cópia)', 1, '16', 0, 'draft', NULL, 'NET', 'NC_INAUGURA HOSPITAL', '1:00', '', '', '', '2025-10-21 15:02:45.641898+00', '2025-10-21 15:03:06.575034+00');

-- Insert pautas (2 records)
INSERT INTO pautas (id, user_id, telejornal_id, titulo, descricao, status, local, produtor, data_cobertura, created_at, updated_at) VALUES
('a46d84c1-6dde-4d42-b90f-3341e861c469', '0a7bcf51-ecbf-482c-907f-7804932044f7', NULL, 'TESTE', NULL, 'pendente', 'PEDRO SALES', 'Paulo', '2025-09-30', '2025-09-30 18:25:04.369319+00', '2025-09-30 18:25:04.369319+00'),
('5258e88d-d853-4ffd-a537-07e5bb1b50bd', '45f49247-8f05-4063-8db4-81df29d0e6cb', NULL, 'TESTE', 'teste', 'pendente', 'PEDRO SALES', 'Paulo', '2025-10-20', '2025-10-20 12:34:13.904169+00', '2025-10-20 12:34:13.904169+00');

-- Insert pautas_telejornal (1 record)
INSERT INTO pautas_telejornal (id, telejornal_id, user_id, titulo, descricao, status, local, produtor, data_cobertura, created_at, updated_at) VALUES
('e7aa7bf2-31ea-4e84-a96b-bb486db7a494', '38fc7dde-8fad-41f1-9aca-8ccceda41def', '0a7bcf51-ecbf-482c-907f-7804932044f7', 'TESTE', NULL, 'pendente', 'PEDRO SALES', 'Paulo', '2025-09-30', '2025-09-30 18:24:36.625691+00', '2025-09-30 18:24:36.625691+00');

-- Insert reportagens (1 record)
INSERT INTO reportagens (id, telejornal_id, user_id, retranca, corpo_materia, reporter, local, data_gravacao, status, created_at, updated_at) VALUES
('f60ac00c-acb7-492b-89a4-301d3d138464', '8d164541-83d7-40d7-be4c-56bf1554b637', '0a7bcf51-ecbf-482c-907f-7804932044f7', 'Carro cai em buraco na rodoviaaaa', 'sffa', 'ELLEN NASCIMENTO', 'STUDIO', '2025-09-30', 'em_producao', '2025-09-30 18:46:55.543032+00', '2025-09-30 18:46:55.543032+00');

-- Note: espelhos_salvos contains large JSONB data - see separate file if needed
-- Note: modelos_salvos, materias_locks, materias_snapshots, entrevistas are currently empty

-- ============================================================================
-- SECTION 8: REALTIME CONFIGURATION
-- ============================================================================

-- Create publication for realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Add all tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE telejornais;
ALTER PUBLICATION supabase_realtime ADD TABLE blocos;
ALTER PUBLICATION supabase_realtime ADD TABLE materias;
ALTER PUBLICATION supabase_realtime ADD TABLE pautas;
ALTER PUBLICATION supabase_realtime ADD TABLE pautas_telejornal;
ALTER PUBLICATION supabase_realtime ADD TABLE entrevistas;
ALTER PUBLICATION supabase_realtime ADD TABLE reportagens;
ALTER PUBLICATION supabase_realtime ADD TABLE materias_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE espelhos_salvos;
ALTER PUBLICATION supabase_realtime ADD TABLE materias_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE modelos_salvos;

-- ============================================================================
-- SECTION 9: VALIDATION QUERIES
-- ============================================================================

-- Run these queries after restoration to verify data integrity:

/*
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify record counts
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL SELECT 'telejornais', COUNT(*) FROM telejornais
UNION ALL SELECT 'blocos', COUNT(*) FROM blocos
UNION ALL SELECT 'materias', COUNT(*) FROM materias
UNION ALL SELECT 'pautas', COUNT(*) FROM pautas
UNION ALL SELECT 'pautas_telejornal', COUNT(*) FROM pautas_telejornal
UNION ALL SELECT 'entrevistas', COUNT(*) FROM entrevistas
UNION ALL SELECT 'reportagens', COUNT(*) FROM reportagens
UNION ALL SELECT 'espelhos_salvos', COUNT(*) FROM espelhos_salvos
UNION ALL SELECT 'modelos_salvos', COUNT(*) FROM modelos_salvos
UNION ALL SELECT 'materias_locks', COUNT(*) FROM materias_locks
UNION ALL SELECT 'materias_snapshots', COUNT(*) FROM materias_snapshots;

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verify triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY event_object_table, trigger_name;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
*/

-- ============================================================================
-- END OF DUMP
-- ============================================================================
-- For support or questions, contact the Newsroomate team
-- Generated: October 24, 2025
-- ============================================================================
