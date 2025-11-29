-- Fase 1: Correção Emergencial dos 32 Espelhos Órfãos Existentes
-- Atualizar estrutura JSONB para incluir dados de identificação do telejornal

-- Para cada espelho salvo, extrair o nome do telejornal do campo 'nome' 
-- e injetar na estrutura JSONB para garantir identificação futura

UPDATE espelhos_salvos
SET estrutura = jsonb_set(
  jsonb_set(
    estrutura,
    '{nome_telejornal}',
    to_jsonb(split_part(nome, ' (', 1))  -- Extrai nome do telejornal do campo 'nome'
  ),
  '{telejornal}',
  jsonb_build_object(
    'nome', split_part(nome, ' (', 1),
    'id', telejornal_id
  )
)
WHERE NOT (estrutura ? 'nome_telejornal' OR estrutura ? 'telejornal')
  OR estrutura->>'nome_telejornal' IS NULL
  OR estrutura->'telejornal' IS NULL;

-- Comentário: Esta migração corrige todos os espelhos salvos que não têm
-- dados de identificação do telejornal na estrutura JSONB.
-- Mesmo se o telejornal for excluído, os dados de identificação permanecerão
-- na estrutura, permitindo recuperação e identificação correta.