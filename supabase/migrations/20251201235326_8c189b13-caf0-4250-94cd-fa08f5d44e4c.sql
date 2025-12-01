-- Criar tabela de relacionamento pautas_telejornal
CREATE TABLE IF NOT EXISTS public.pautas_telejornal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pauta_id UUID NOT NULL REFERENCES public.pautas(id) ON DELETE CASCADE,
  telejornal_id UUID NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pauta_id, telejornal_id)
);

-- Criar tabela reportagens
CREATE TABLE IF NOT EXISTS public.reportagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  reporter TEXT,
  editor TEXT,
  local_gravacao TEXT,
  data_gravacao DATE,
  duracao INTEGER,
  status TEXT DEFAULT 'em_producao',
  observacoes TEXT,
  equipamento TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de relacionamento reportagens_telejornal
CREATE TABLE IF NOT EXISTS public.reportagens_telejornal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reportagem_id UUID NOT NULL REFERENCES public.reportagens(id) ON DELETE CASCADE,
  telejornal_id UUID NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(reportagem_id, telejornal_id)
);

-- Criar tabela entrevistas
CREATE TABLE IF NOT EXISTS public.entrevistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  entrevistado TEXT NOT NULL,
  tema TEXT,
  descricao TEXT,
  reporter TEXT,
  local TEXT,
  data_entrevista DATE,
  duracao INTEGER,
  status TEXT DEFAULT 'agendada',
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de relacionamento entrevistas_telejornal
CREATE TABLE IF NOT EXISTS public.entrevistas_telejornal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrevista_id UUID NOT NULL REFERENCES public.entrevistas(id) ON DELETE CASCADE,
  telejornal_id UUID NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(entrevista_id, telejornal_id)
);

-- Enable RLS
ALTER TABLE public.pautas_telejornal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportagens_telejornal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrevistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrevistas_telejornal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pautas_telejornal
CREATE POLICY "Users can view pautas_telejornal of accessible telejornais"
ON public.pautas_telejornal FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users with permission can create pautas_telejornal"
ON public.pautas_telejornal FOR INSERT
WITH CHECK (
  has_effective_permission(auth.uid(), 'criar_pauta', telejornal_id) AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users with permission can delete pautas_telejornal"
ON public.pautas_telejornal FOR DELETE
USING (
  has_effective_permission(auth.uid(), 'excluir_pauta', telejornal_id) AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

-- RLS Policies for reportagens
CREATE POLICY "Users can view reportagens"
ON public.reportagens FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own reportagens"
ON public.reportagens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reportagens"
ON public.reportagens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users with permission can delete reportagens"
ON public.reportagens FOR DELETE
USING (
  auth.uid() = user_id OR
  has_effective_permission(auth.uid(), 'editar_materia')
);

-- RLS Policies for reportagens_telejornal
CREATE POLICY "Users can view reportagens_telejornal of accessible telejornais"
ON public.reportagens_telejornal FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users can create reportagens_telejornal"
ON public.reportagens_telejornal FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users can delete reportagens_telejornal"
ON public.reportagens_telejornal FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

-- RLS Policies for entrevistas
CREATE POLICY "Users can view entrevistas"
ON public.entrevistas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own entrevistas"
ON public.entrevistas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entrevistas"
ON public.entrevistas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users with permission can delete entrevistas"
ON public.entrevistas FOR DELETE
USING (
  auth.uid() = user_id OR
  has_effective_permission(auth.uid(), 'editar_materia')
);

-- RLS Policies for entrevistas_telejornal
CREATE POLICY "Users can view entrevistas_telejornal of accessible telejornais"
ON public.entrevistas_telejornal FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users can create entrevistas_telejornal"
ON public.entrevistas_telejornal FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Users can delete entrevistas_telejornal"
ON public.entrevistas_telejornal FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  can_access_telejornal(auth.uid(), telejornal_id)
);

-- Triggers for updated_at
CREATE TRIGGER update_reportagens_updated_at
BEFORE UPDATE ON public.reportagens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entrevistas_updated_at
BEFORE UPDATE ON public.entrevistas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();