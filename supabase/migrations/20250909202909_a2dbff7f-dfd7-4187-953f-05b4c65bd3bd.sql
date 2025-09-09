-- Reverter alterações: restaurar ON DELETE CASCADE na foreign key
-- Isso desfaz as mudanças da migração anterior

-- Remover a foreign key constraint atual (sem CASCADE)
ALTER TABLE public.espelhos_salvos 
DROP CONSTRAINT IF EXISTS espelhos_salvos_telejornal_id_fkey;

-- Recriar a foreign key constraint com DELETE CASCADE (comportamento original)
-- Quando um telejornal é deletado, os espelhos salvos associados também serão deletados
ALTER TABLE public.espelhos_salvos 
ADD CONSTRAINT espelhos_salvos_telejornal_id_fkey 
FOREIGN KEY (telejornal_id) 
REFERENCES public.telejornais(id) 
ON DELETE CASCADE;