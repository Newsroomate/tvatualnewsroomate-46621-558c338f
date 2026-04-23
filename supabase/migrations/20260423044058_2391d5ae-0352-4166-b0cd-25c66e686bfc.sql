
DO $$
DECLARE
  _ids uuid[];
BEGIN
  SELECT ARRAY(SELECT id FROM public.telejornais WHERE nome IN ('Agro Atual 2203', 'AGRO ATUAL 5-4')) INTO _ids;

  IF array_length(_ids, 1) IS NULL THEN
    RAISE NOTICE 'Nenhum telejornal encontrado com esses nomes.';
    RETURN;
  END IF;

  -- Apaga matérias dos blocos desses telejornais
  DELETE FROM public.materias
  WHERE bloco_id IN (SELECT id FROM public.blocos WHERE telejornal_id = ANY(_ids));

  -- Apaga blocos
  DELETE FROM public.blocos WHERE telejornal_id = ANY(_ids);

  -- Apaga vínculos de pautas/entrevistas/reportagens
  DELETE FROM public.pautas_telejornal WHERE telejornal_id = ANY(_ids);
  DELETE FROM public.entrevistas_telejornal WHERE telejornal_id = ANY(_ids);
  DELETE FROM public.reportagens_telejornal WHERE telejornal_id = ANY(_ids);

  -- Apaga espelhos salvos / vmix / mensagens / acessos
  DELETE FROM public.espelhos_salvos WHERE telejornal_id = ANY(_ids);
  DELETE FROM public.vmix_settings WHERE telejornal_id = ANY(_ids);
  DELETE FROM public.viewer_messages WHERE telejornal_id = ANY(_ids);
  DELETE FROM public.user_telejornal_access WHERE telejornal_id = ANY(_ids);

  -- Finalmente, apaga os telejornais
  DELETE FROM public.telejornais WHERE id = ANY(_ids);
END $$;
