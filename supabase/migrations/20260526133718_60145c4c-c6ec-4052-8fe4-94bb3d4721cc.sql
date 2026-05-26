
-- Bucket de Storage para fundos de GC (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gc-backgrounds', 'gc-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do Storage
CREATE POLICY "GC backgrounds publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'gc-backgrounds');

CREATE POLICY "Editores podem fazer upload de GC backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gc-backgrounds'
  AND has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type)
);

CREATE POLICY "Editores podem atualizar GC backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gc-backgrounds'
  AND has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type)
);

CREATE POLICY "Editores podem deletar GC backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gc-backgrounds'
  AND has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type)
);

-- Tabela gc_pacote_grafico
CREATE TABLE public.gc_pacote_grafico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telejornal_id uuid NULL,
  tipo text NOT NULL,
  media_url text NULL,
  media_type text NULL,
  layout jsonb NOT NULL DEFAULT '{
    "linha1": {"x":50,"y":70,"fontSize":28,"color":"#FFFFFF","align":"center","bold":true,"fontFamily":"Inter"},
    "linha2": {"x":50,"y":82,"fontSize":18,"color":"#FFFFFF","align":"center","bold":false,"fontFamily":"Inter"}
  }'::jsonb,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gc_pacote_grafico_tipo_check CHECK (tipo IN ('credito','reporter','cinegrafista','produtor','linha_fina','geral'))
);

CREATE UNIQUE INDEX gc_pacote_grafico_unique_telejornal_tipo
  ON public.gc_pacote_grafico (COALESCE(telejornal_id, '00000000-0000-0000-0000-000000000000'::uuid), tipo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gc_pacote_grafico TO authenticated;
GRANT ALL ON public.gc_pacote_grafico TO service_role;

ALTER TABLE public.gc_pacote_grafico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pacote grafico of accessible telejornais"
ON public.gc_pacote_grafico FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

CREATE POLICY "Editors can insert pacote grafico"
ON public.gc_pacote_grafico FOR INSERT
TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type, telejornal_id)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

CREATE POLICY "Editors can update pacote grafico"
ON public.gc_pacote_grafico FOR UPDATE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type, telejornal_id)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

CREATE POLICY "Editors can delete pacote grafico"
ON public.gc_pacote_grafico FOR DELETE
TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type, telejornal_id)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

CREATE TRIGGER trg_gc_pacote_grafico_updated_at
  BEFORE UPDATE ON public.gc_pacote_grafico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
