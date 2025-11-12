-- Adicionar coluna 'editor' na tabela materias
ALTER TABLE public.materias 
ADD COLUMN IF NOT EXISTS editor text;

-- Adicionar comentário descritivo
COMMENT ON COLUMN public.materias.editor IS 'Nome do editor responsável pela matéria';