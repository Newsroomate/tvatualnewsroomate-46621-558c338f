
-- ============================================================================
-- 1. Enum para status do playout
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.playout_status_type AS ENUM ('idle', 'running', 'paused');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. Tabela playout_status (1 por telejornal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playout_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL UNIQUE,
  status public.playout_status_type NOT NULL DEFAULT 'idle',
  current_materia_id uuid,
  started_at timestamptz,
  current_item_started_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playout_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view playout_status of accessible telejornais"
  ON public.playout_status FOR SELECT
  USING (auth.uid() IS NOT NULL AND can_access_telejornal(auth.uid(), telejornal_id));

CREATE POLICY "Users with permission can insert playout_status"
  ON public.playout_status FOR INSERT
  WITH CHECK (
    has_effective_permission(auth.uid(), 'gerenciar_espelho'::permission_type, telejornal_id)
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE POLICY "Users with permission can update playout_status"
  ON public.playout_status FOR UPDATE
  USING (
    has_effective_permission(auth.uid(), 'gerenciar_espelho'::permission_type, telejornal_id)
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE POLICY "Users with permission can delete playout_status"
  ON public.playout_status FOR DELETE
  USING (
    has_effective_permission(auth.uid(), 'gerenciar_espelho'::permission_type, telejornal_id)
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE TRIGGER trg_playout_status_updated_at
  BEFORE UPDATE ON public.playout_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. Tabela playout_triggers (N por matéria)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playout_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL,
  trigger_type text NOT NULL,
  trigger_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  execute_at text NOT NULL DEFAULT 'on_take',
  offset_ms integer NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playout_triggers_materia ON public.playout_triggers(materia_id);

ALTER TABLE public.playout_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view triggers of accessible telejornais"
  ON public.playout_triggers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.materias m
      JOIN public.blocos b ON b.id = m.bloco_id
      WHERE m.id = playout_triggers.materia_id
      AND can_access_telejornal(auth.uid(), b.telejornal_id)
    )
  );

CREATE POLICY "Users with permission can insert triggers"
  ON public.playout_triggers FOR INSERT
  WITH CHECK (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND EXISTS (
      SELECT 1 FROM public.materias m
      JOIN public.blocos b ON b.id = m.bloco_id
      WHERE m.id = playout_triggers.materia_id
      AND can_access_telejornal(auth.uid(), b.telejornal_id)
    )
  );

CREATE POLICY "Users with permission can update triggers"
  ON public.playout_triggers FOR UPDATE
  USING (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND EXISTS (
      SELECT 1 FROM public.materias m
      JOIN public.blocos b ON b.id = m.bloco_id
      WHERE m.id = playout_triggers.materia_id
      AND can_access_telejornal(auth.uid(), b.telejornal_id)
    )
  );

CREATE POLICY "Users with permission can delete triggers"
  ON public.playout_triggers FOR DELETE
  USING (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND EXISTS (
      SELECT 1 FROM public.materias m
      JOIN public.blocos b ON b.id = m.bloco_id
      WHERE m.id = playout_triggers.materia_id
      AND can_access_telejornal(auth.uid(), b.telejornal_id)
    )
  );

CREATE TRIGGER trg_playout_triggers_updated_at
  BEFORE UPDATE ON public.playout_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. Tabela playlist_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL,
  materia_id uuid,
  titulo text NOT NULL,
  clip text,
  tipo text,
  duracao integer DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'espera',
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_telejornal ON public.playlist_items(telejornal_id);

ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view playlist of accessible telejornais"
  ON public.playlist_items FOR SELECT
  USING (auth.uid() IS NOT NULL AND can_access_telejornal(auth.uid(), telejornal_id));

CREATE POLICY "Users with permission can insert playlist"
  ON public.playlist_items FOR INSERT
  WITH CHECK (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE POLICY "Users with permission can update playlist"
  ON public.playlist_items FOR UPDATE
  USING (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE POLICY "Users with permission can delete playlist"
  ON public.playlist_items FOR DELETE
  USING (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND can_access_telejornal(auth.uid(), telejornal_id)
  );

CREATE TRIGGER trg_playlist_items_updated_at
  BEFORE UPDATE ON public.playlist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Tabela gc_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'geral',
  campos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gc_templates_telejornal ON public.gc_templates(telejornal_id);

ALTER TABLE public.gc_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gc_templates"
  ON public.gc_templates FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      telejornal_id IS NULL
      OR can_access_telejornal(auth.uid(), telejornal_id)
    )
  );

CREATE POLICY "Users with permission can insert gc_templates"
  ON public.gc_templates FOR INSERT
  WITH CHECK (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
  );

CREATE POLICY "Users with permission can update gc_templates"
  ON public.gc_templates FOR UPDATE
  USING (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
  );

CREATE POLICY "Users with permission can delete gc_templates"
  ON public.gc_templates FOR DELETE
  USING (
    has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
    AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
  );

CREATE TRIGGER trg_gc_templates_updated_at
  BEFORE UPDATE ON public.gc_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. Tabela gc_saved_entries (biblioteca pessoal por usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gc_saved_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  linha1 text NOT NULL,
  linha2 text DEFAULT '',
  use_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo, linha1, linha2)
);

CREATE INDEX IF NOT EXISTS idx_gc_saved_entries_user ON public.gc_saved_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gc_saved_entries_linha1 ON public.gc_saved_entries(user_id, linha1);

ALTER TABLE public.gc_saved_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved gcs"
  ON public.gc_saved_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved gcs"
  ON public.gc_saved_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved gcs"
  ON public.gc_saved_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved gcs"
  ON public.gc_saved_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_gc_saved_entries_updated_at
  BEFORE UPDATE ON public.gc_saved_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. Novas colunas em materias e vmix_settings
-- ============================================================================
ALTER TABLE public.materias
  ADD COLUMN IF NOT EXISTS gcs jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.vmix_settings
  ADD COLUMN IF NOT EXISTS gc_field_mappings jsonb NOT NULL DEFAULT
  '{
    "credito":   {"input": "GC_Credito",   "line1Field": "Linha1.Text", "line2Field": "Linha2.Text"},
    "reporter":  {"input": "GC_Reporter",  "line1Field": "Linha1.Text", "line2Field": "Linha2.Text"},
    "cinegrafista": {"input": "GC_Cinegrafista", "line1Field": "Linha1.Text", "line2Field": "Linha2.Text"},
    "produtor":  {"input": "GC_Produtor",  "line1Field": "Linha1.Text", "line2Field": "Linha2.Text"},
    "linha_fina":{"input": "GC_LinhaFina", "line1Field": "Linha1.Text", "line2Field": "Linha2.Text"},
    "geral":     {"input": "GC_Geral",     "line1Field": "Linha1.Text", "line2Field": "Linha2.Text"}
  }'::jsonb;

-- ============================================================================
-- 8. Realtime
-- ============================================================================
ALTER TABLE public.playout_status REPLICA IDENTITY FULL;
ALTER TABLE public.playout_triggers REPLICA IDENTITY FULL;
ALTER TABLE public.playlist_items REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playout_status;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playout_triggers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_items;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
