
-- Criar tabela para matérias de snapshots que não depende de chaves estrangeiras
CREATE TABLE public.materias_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  materia_original_id UUID, -- ID da matéria original se existir
  snapshot_id UUID, -- Referência ao snapshot de onde veio
  retranca TEXT NOT NULL,
  bloco_nome TEXT, -- Nome do bloco ao invés de ID para evitar FK
  bloco_ordem INTEGER,
  ordem INTEGER NOT NULL DEFAULT 1,
  duracao INTEGER DEFAULT 0,
  clip TEXT,
  tempo_clip TEXT,
  pagina TEXT,
  reporter TEXT,
  status TEXT DEFAULT 'draft',
  texto TEXT,
  cabeca TEXT,
  gc TEXT,
  tipo_material TEXT,
  local_gravacao TEXT,
  tags TEXT[],
  equipamento TEXT,
  horario_exibicao TIMESTAMP WITH TIME ZONE,
  is_snapshot BOOLEAN DEFAULT TRUE, -- Flag para identificar matérias de snapshot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para segurança
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso a todos os usuários autenticados (snapshots são geralmente públicos)
CREATE POLICY "Authenticated users can view snapshots" 
  ON public.materias_snapshots 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can modify snapshots" 
  ON public.materias_snapshots 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_materias_snapshots_updated_at
  BEFORE UPDATE ON public.materias_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo para identificar origem na tabela materias original
ALTER TABLE public.materias 
ADD COLUMN IF NOT EXISTS is_from_snapshot BOOLEAN DEFAULT FALSE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_materias_snapshots_snapshot_id ON public.materias_snapshots(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_materias_snapshots_original_id ON public.materias_snapshots(materia_original_id);
