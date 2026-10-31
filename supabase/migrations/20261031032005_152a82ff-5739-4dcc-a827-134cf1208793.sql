CREATE OR REPLACE FUNCTION public.force_release_materia_lock(p_materia_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'editor_chefe')
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'editor_chefe')) THEN
    RAISE EXCEPTION 'Apenas o Editor-Chefe pode forçar o desbloqueio';
  END IF;
  DELETE FROM public.materias_locks WHERE materia_id = p_materia_id RETURNING user_id INTO _owner;
  IF _owner IS NULL THEN RETURN false; END IF;
  INSERT INTO public.permission_audit_logs (actor_user_id, action, target_user_id, details)
  VALUES (auth.uid(), 'force_release_materia_lock', _owner, jsonb_build_object('materia_id', p_materia_id));
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.force_release_materia_lock(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.force_release_materia_lock(uuid) TO authenticated;