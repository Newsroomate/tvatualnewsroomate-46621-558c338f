CREATE OR REPLACE FUNCTION public.create_full_backup(_type text DEFAULT 'automatic', _created_by uuid DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _data jsonb;
BEGIN
  _data := jsonb_build_object(
    'version', 2,
    'telejornais', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.telejornais t), '[]'::jsonb),
    'blocos', COALESCE((SELECT jsonb_agg(to_jsonb(b)) FROM public.blocos b), '[]'::jsonb),
    'materias', COALESCE((SELECT jsonb_agg(to_jsonb(m)) FROM public.materias m), '[]'::jsonb),
    'pautas', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM public.pautas p), '[]'::jsonb),
    'pautas_telejornal', COALESCE((SELECT jsonb_agg(to_jsonb(pt)) FROM public.pautas_telejornal pt), '[]'::jsonb),
    'espelhos_salvos', COALESCE((SELECT jsonb_agg(to_jsonb(e)) FROM public.espelhos_salvos e), '[]'::jsonb)
  );

  INSERT INTO public.espelhos_backup (backup_type, scope, total_espelhos, total_blocos, total_materias, total_telejornais, total_pautas, data, created_by, notes)
  VALUES (
    _type, 'full',
    jsonb_array_length(_data->'espelhos_salvos'),
    jsonb_array_length(_data->'blocos'),
    jsonb_array_length(_data->'materias'),
    jsonb_array_length(_data->'telejornais'),
    jsonb_array_length(_data->'pautas'),
    _data, _created_by, _notes
  ) RETURNING id INTO _id;

  IF _type = 'automatic' THEN
    DELETE FROM public.espelhos_backup
    WHERE backup_type = 'automatic' AND created_at < now() - interval '30 days';
  END IF;

  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_full_backup(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_full_backup(text, uuid, text) TO service_role;