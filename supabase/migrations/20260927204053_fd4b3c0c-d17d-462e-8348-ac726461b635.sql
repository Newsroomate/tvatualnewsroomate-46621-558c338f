CREATE OR REPLACE FUNCTION public.log_materia_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.materia_edit_history (materia_id, user_id, action)
    VALUES (NEW.id, auth.uid(), TG_ARGV[0]);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS log_materia_insert ON public.materias;
CREATE TRIGGER log_materia_insert
AFTER INSERT ON public.materias
FOR EACH ROW EXECUTE FUNCTION public.log_materia_edit('create');

DROP TRIGGER IF EXISTS log_materia_update ON public.materias;
CREATE TRIGGER log_materia_update
AFTER UPDATE ON public.materias
FOR EACH ROW EXECUTE FUNCTION public.log_materia_edit('update');