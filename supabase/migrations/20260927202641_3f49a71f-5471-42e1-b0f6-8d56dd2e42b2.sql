-- 1. Colunas adicionais (não destrutivas)
ALTER TABLE public.pautas
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS entrevistados_contatos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.materias
  ADD COLUMN IF NOT EXISTS vmix_link_type text,
  ADD COLUMN IF NOT EXISTS vmix_target text;

ALTER TABLE public.materias_snapshots
  ADD COLUMN IF NOT EXISTS vmix_link_type text,
  ADD COLUMN IF NOT EXISTS vmix_target text;

ALTER TABLE public.telejornais
  ADD COLUMN IF NOT EXISTS hora_inicio time,
  ADD COLUMN IF NOT EXISTS hora_fim time;

CREATE INDEX IF NOT EXISTS idx_pautas_deleted_at ON public.pautas (deleted_at);

-- 2. Histórico de edições de matéria
CREATE TABLE IF NOT EXISTS public.materia_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'update',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.materia_edit_history TO authenticated;
GRANT ALL ON public.materia_edit_history TO service_role;

ALTER TABLE public.materia_edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view materia history" ON public.materia_edit_history;
CREATE POLICY "Authenticated can view materia history"
ON public.materia_edit_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert materia history" ON public.materia_edit_history;
CREATE POLICY "Authenticated can insert materia history"
ON public.materia_edit_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_materia_edit_history_materia ON public.materia_edit_history (materia_id, created_at DESC);

-- 3. Catálogo de contatos de entrevistados
CREATE TABLE IF NOT EXISTS public.contatos_entrevistados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contatos_entrevistados TO authenticated;
GRANT ALL ON public.contatos_entrevistados TO service_role;

ALTER TABLE public.contatos_entrevistados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view contatos" ON public.contatos_entrevistados;
CREATE POLICY "Authenticated can view contatos"
ON public.contatos_entrevistados FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert contatos" ON public.contatos_entrevistados;
CREATE POLICY "Authenticated can insert contatos"
ON public.contatos_entrevistados FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update contatos" ON public.contatos_entrevistados;
CREATE POLICY "Authenticated can update contatos"
ON public.contatos_entrevistados FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can delete contatos" ON public.contatos_entrevistados;
CREATE POLICY "Authenticated can delete contatos"
ON public.contatos_entrevistados FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_contatos_entrevistados_nome ON public.contatos_entrevistados (lower(nome));

DROP TRIGGER IF EXISTS trg_contatos_entrevistados_updated_at ON public.contatos_entrevistados;
CREATE TRIGGER trg_contatos_entrevistados_updated_at
BEFORE UPDATE ON public.contatos_entrevistados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Registro de disparos ao vMix
CREATE TABLE IF NOT EXISTS public.vmix_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid REFERENCES public.materias(id) ON DELETE SET NULL,
  materia_retranca text,
  telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'trigger_link',
  link_type text,
  target text,
  success boolean NOT NULL DEFAULT false,
  message text,
  error_detail text,
  vmix_host text,
  vmix_port integer,
  duration_ms integer,
  source text NOT NULL DEFAULT 'manual',
  user_id uuid,
  user_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.vmix_trigger_logs TO authenticated;
GRANT ALL ON public.vmix_trigger_logs TO service_role;

ALTER TABLE public.vmix_trigger_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view vmix trigger logs" ON public.vmix_trigger_logs;
CREATE POLICY "Authenticated can view vmix trigger logs"
ON public.vmix_trigger_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert vmix trigger logs" ON public.vmix_trigger_logs;
CREATE POLICY "Authenticated can insert vmix trigger logs"
ON public.vmix_trigger_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vmix_trigger_logs_created_at ON public.vmix_trigger_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vmix_trigger_logs_materia ON public.vmix_trigger_logs (materia_id);