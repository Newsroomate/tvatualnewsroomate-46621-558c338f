-- Remover a foreign key constraint atual que causa DELETE CASCADE
ALTER TABLE public.espelhos_salvos 
DROP CONSTRAINT IF EXISTS espelhos_salvos_telejornal_id_fkey;

-- Recriar a foreign key constraint sem DELETE CASCADE
-- Isso permite que espelhos salvos fiquem "órfãos" quando um telejornal é deletado
ALTER TABLE public.espelhos_salvos 
ADD CONSTRAINT espelhos_salvos_telejornal_id_fkey 
FOREIGN KEY (telejornal_id) 
REFERENCES public.telejornais(id);

-- Adicionar comentário explicando o comportamento
COMMENT ON CONSTRAINT espelhos_salvos_telejornal_id_fkey ON public.espelhos_salvos 
IS 'Foreign key sem CASCADE - permite espelhos órfãos quando telejornal é deletado';