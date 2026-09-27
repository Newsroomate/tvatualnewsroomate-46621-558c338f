ALTER TABLE public.espelhos_backup
  ADD COLUMN IF NOT EXISTS total_telejornais integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pautas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'espelhos';