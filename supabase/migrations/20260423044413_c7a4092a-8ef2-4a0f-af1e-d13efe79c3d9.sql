
DO $$
DECLARE
  _id uuid := '12afae43-2fed-4134-b8f2-803fcafd035e';
BEGIN
  DELETE FROM public.materias WHERE bloco_id IN (SELECT id FROM public.blocos WHERE telejornal_id = _id);
  DELETE FROM public.blocos WHERE telejornal_id = _id;
  DELETE FROM public.pautas_telejornal WHERE telejornal_id = _id;
  DELETE FROM public.entrevistas_telejornal WHERE telejornal_id = _id;
  DELETE FROM public.reportagens_telejornal WHERE telejornal_id = _id;
  DELETE FROM public.espelhos_salvos WHERE telejornal_id = _id;
  DELETE FROM public.vmix_settings WHERE telejornal_id = _id;
  DELETE FROM public.viewer_messages WHERE telejornal_id = _id;
  DELETE FROM public.user_telejornal_access WHERE telejornal_id = _id;
  DELETE FROM public.telejornais WHERE id = _id;
END $$;
