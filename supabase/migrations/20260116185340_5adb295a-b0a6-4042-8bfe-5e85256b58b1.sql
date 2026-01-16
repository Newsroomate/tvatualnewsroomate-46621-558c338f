-- Tabela para armazenar mensagens de telespectadores do WhatsApp
CREATE TABLE public.viewer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id UUID REFERENCES telejornais(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  sender_name TEXT,
  profile_photo_url TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio')),
  media_url TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'on_air', 'used', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  sent_to_vmix_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_viewer_messages_status ON public.viewer_messages(status);
CREATE INDEX idx_viewer_messages_telejornal ON public.viewer_messages(telejornal_id);
CREATE INDEX idx_viewer_messages_received_at ON public.viewer_messages(received_at DESC);

-- RLS
ALTER TABLE public.viewer_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Authenticated users can view messages"
ON public.viewer_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert messages"
ON public.viewer_messages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
ON public.viewer_messages FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete messages"
ON public.viewer_messages FOR DELETE
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_viewer_messages_updated_at
BEFORE UPDATE ON public.viewer_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para mídia de telespectadores
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'viewer-media',
  'viewer-media',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Políticas de storage
CREATE POLICY "Public read access for viewer media"
ON storage.objects FOR SELECT
USING (bucket_id = 'viewer-media');

CREATE POLICY "Authenticated users can upload viewer media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'viewer-media');

CREATE POLICY "Authenticated users can update viewer media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'viewer-media');

CREATE POLICY "Authenticated users can delete viewer media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'viewer-media');

-- Tabela para configurações do vMix
CREATE TABLE public.vmix_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id UUID REFERENCES telejornais(id) ON DELETE CASCADE UNIQUE,
  vmix_host TEXT NOT NULL DEFAULT 'localhost',
  vmix_port INTEGER NOT NULL DEFAULT 8088,
  title_input_name TEXT NOT NULL DEFAULT 'TarjaZAP',
  name_field TEXT NOT NULL DEFAULT 'Nome',
  message_field TEXT NOT NULL DEFAULT 'Mensagem',
  photo_field TEXT NOT NULL DEFAULT 'Foto',
  overlay_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para vmix_settings
ALTER TABLE public.vmix_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage vmix settings"
ON public.vmix_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_vmix_settings_updated_at
BEFORE UPDATE ON public.vmix_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();