ALTER TABLE public.materia_edit_history
  ADD COLUMN IF NOT EXISTS telejornal_id uuid,
  ADD COLUMN IF NOT EXISTS bloco_id uuid,
  ADD COLUMN IF NOT EXISTS retranca text,
  ADD COLUMN IF NOT EXISTS changed_fields text[],
  ADD COLUMN IF NOT EXISTS diff jsonb,
  ADD COLUMN IF NOT EXISTS snapshot jsonb,
  ADD COLUMN IF NOT EXISTS restored_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_meh_telejornal_created ON public.materia_edit_history (telejornal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meh_created ON public.materia_edit_history (created_at);

CREATE OR REPLACE FUNCTION public.can_view_audit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND (
    public.has_role(_user_id, 'editor_chefe')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'editor_chefe')
    OR public.has_permission(_user_id, 'gerenciar_usuarios')
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_audit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_audit(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.log_materia_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.materias;
  _tj uuid;
  _fields text[] := ARRAY[]::text[];
  _diff jsonb := '{}'::jsonb;
  _f text;
  _o jsonb; _n jsonb;
  _tracked text[] := ARRAY['retranca','cabeca','texto','gc','gcs','reporter','tipo_material','clip','tempo_clip','duracao','pagina','status','editor','local_gravacao','bloco_id','ordem','vmix_link_type','vmix_target'];
BEGIN
  IF _uid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN _row := OLD; ELSE _row := NEW; END IF;
  SELECT telejornal_id INTO _tj FROM public.blocos WHERE id = _row.bloco_id;

  IF TG_OP = 'UPDATE' THEN
    _o := to_jsonb(OLD); _n := to_jsonb(NEW);
    FOREACH _f IN ARRAY _tracked LOOP
      IF (_o -> _f) IS DISTINCT FROM (_n -> _f) THEN
        _fields := _fields || _f;
        _diff := _diff || jsonb_build_object(_f, jsonb_build_object('old', _o -> _f, 'new', _n -> _f));
      END IF;
    END LOOP;
    IF array_length(_fields, 1) IS NULL THEN RETURN NEW; END IF;
    INSERT INTO public.materia_edit_history (materia_id, user_id, action, telejornal_id, bloco_id, retranca, changed_fields, diff)
    VALUES (NEW.id, _uid, 'update', _tj, NEW.bloco_id, NEW.retranca, _fields, _diff);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.materia_edit_history (materia_id, user_id, action, telejornal_id, bloco_id, retranca)
    VALUES (NEW.id, _uid, 'create', _tj, NEW.bloco_id, NEW.retranca);
    RETURN NEW;
  ELSE
    INSERT INTO public.materia_edit_history (materia_id, user_id, action, telejornal_id, bloco_id, retranca, snapshot)
    VALUES (OLD.id, _uid, 'delete', _tj, OLD.bloco_id, OLD.retranca, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_materia_edit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS log_materia_insert ON public.materias;
DROP TRIGGER IF EXISTS log_materia_update ON public.materias;
DROP TRIGGER IF EXISTS log_materia_delete ON public.materias;
CREATE TRIGGER log_materia_insert AFTER INSERT ON public.materias FOR EACH ROW EXECUTE FUNCTION public.log_materia_edit();
CREATE TRIGGER log_materia_update AFTER UPDATE ON public.materias FOR EACH ROW EXECUTE FUNCTION public.log_materia_edit();
CREATE TRIGGER log_materia_delete BEFORE DELETE ON public.materias FOR EACH ROW EXECUTE FUNCTION public.log_materia_edit();

DROP POLICY IF EXISTS "Authenticated can view materia history" ON public.materia_edit_history;
CREATE POLICY "Chefia can view materia history" ON public.materia_edit_history
FOR SELECT TO authenticated USING (public.can_view_audit(auth.uid()));

GRANT UPDATE (restored_at) ON public.materia_edit_history TO authenticated;
DROP POLICY IF EXISTS "Chefia can mark restored" ON public.materia_edit_history;
CREATE POLICY "Chefia can mark restored" ON public.materia_edit_history
FOR UPDATE TO authenticated USING (public.can_view_audit(auth.uid())) WITH CHECK (public.can_view_audit(auth.uid()));

CREATE OR REPLACE FUNCTION public.cleanup_old_materia_history()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  DELETE FROM public.materia_edit_history WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_materia_history() FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
  PERFORM cron.unschedule('cleanup-materia-history');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('cleanup-materia-history', '0 7 * * *', 'SELECT public.cleanup_old_materia_history();');