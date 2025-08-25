-- Corrigir problemas de realtime no sistema

-- 1. Criar função para habilitar realtime em tabelas
CREATE OR REPLACE FUNCTION public.enable_realtime(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 2. Habilitar realtime para todas as tabelas principais
SELECT public.enable_realtime('materias');
SELECT public.enable_realtime('blocos');
SELECT public.enable_realtime('telejornais');
SELECT public.enable_realtime('pautas');
SELECT public.enable_realtime('espelhos_salvos');
SELECT public.enable_realtime('modelos_salvos');
SELECT public.enable_realtime('materias_snapshots');
SELECT public.enable_realtime('profiles');

-- 3. Garantir que todas as tabelas estão configuradas corretamente
ALTER TABLE public.materias REPLICA IDENTITY FULL;
ALTER TABLE public.blocos REPLICA IDENTITY FULL;
ALTER TABLE public.telejornais REPLICA IDENTITY FULL;
ALTER TABLE public.pautas REPLICA IDENTITY FULL;
ALTER TABLE public.espelhos_salvos REPLICA IDENTITY FULL;
ALTER TABLE public.modelos_salvos REPLICA IDENTITY FULL;
ALTER TABLE public.materias_snapshots REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;