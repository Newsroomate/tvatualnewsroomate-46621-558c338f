-- Create espelhos_backup table
CREATE TABLE IF NOT EXISTS public.espelhos_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  backup_type TEXT NOT NULL DEFAULT 'automatic' CHECK (backup_type IN ('manual', 'automatic')),
  total_espelhos INTEGER NOT NULL DEFAULT 0,
  total_materias INTEGER NOT NULL DEFAULT 0,
  total_blocos INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.espelhos_backup ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only editor_chefe can manage backups
CREATE POLICY "Editor chefe can view all backups"
  ON public.espelhos_backup
  FOR SELECT
  TO authenticated
  USING (has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type));

CREATE POLICY "Editor chefe can create backups"
  ON public.espelhos_backup
  FOR INSERT
  TO authenticated
  WITH CHECK (has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type));

CREATE POLICY "Editor chefe can delete backups"
  ON public.espelhos_backup
  FOR DELETE
  TO authenticated
  USING (has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type));

-- Create index for faster queries
CREATE INDEX idx_espelhos_backup_created_at ON public.espelhos_backup(created_at DESC);

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily backup at 3 AM
SELECT cron.schedule(
  'daily-espelhos-backup',
  '0 3 * * *', -- Every day at 3 AM
  $$
  SELECT
    net.http_post(
      url:='https://rigluylhplrrlfkssrur.supabase.co/functions/v1/backup-espelhos',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2x1eWxocGxycmxma3NzcnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTAwMTUsImV4cCI6MjA3MTY2NjAxNX0.GNltlbsZLrBHNe52b1Vk5Cm6rZPOk11FtuaoDm3waLc"}'::jsonb,
      body:='{"type": "automatic"}'::jsonb
    ) as request_id;
  $$
);

-- Function to cleanup old backups (keep only last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.espelhos_backup
  WHERE created_at < (now() - interval '30 days')
    AND backup_type = 'automatic';
END;
$$;

-- Schedule cleanup to run daily at 4 AM (after backup)
SELECT cron.schedule(
  'cleanup-old-backups',
  '0 4 * * *',
  'SELECT public.cleanup_old_backups();'
);