-- Helper function: only the two authorized users can manage trash
CREATE OR REPLACE FUNCTION public.is_trash_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IN (
    '512511d0-ff42-4caf-89c6-bf5a9974895c'::uuid, -- leandrovieira007@hotmail.com
    '6c5e3211-d555-472b-8d90-6e6d63daa74b'::uuid  -- ellencristinaaa@gmail.com
  );
$$;

-- Trash table
CREATE TABLE public.deleted_items_trash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN (
    'telejornal', 'bloco', 'materia', 'pauta', 'entrevista', 'reportagem'
  )),
  entity_id uuid NOT NULL,
  entity_name text,
  snapshot jsonb NOT NULL,
  deleted_by uuid NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  restored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deleted_items_trash_expires_at ON public.deleted_items_trash (expires_at);
CREATE INDEX idx_deleted_items_trash_deleted_by ON public.deleted_items_trash (deleted_by);
CREATE INDEX idx_deleted_items_trash_entity ON public.deleted_items_trash (entity_type, entity_id);

ALTER TABLE public.deleted_items_trash ENABLE ROW LEVEL SECURITY;

-- RLS: only the two authorized users
CREATE POLICY "Only authorized users can view trash"
ON public.deleted_items_trash
FOR SELECT
TO authenticated
USING (public.is_trash_manager(auth.uid()));

CREATE POLICY "Only authorized users can insert into trash"
ON public.deleted_items_trash
FOR INSERT
TO authenticated
WITH CHECK (public.is_trash_manager(auth.uid()));

CREATE POLICY "Only authorized users can update trash"
ON public.deleted_items_trash
FOR UPDATE
TO authenticated
USING (public.is_trash_manager(auth.uid()))
WITH CHECK (public.is_trash_manager(auth.uid()));

CREATE POLICY "Only authorized users can delete from trash"
ON public.deleted_items_trash
FOR DELETE
TO authenticated
USING (public.is_trash_manager(auth.uid()));

-- Cleanup function: removes expired trash entries (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_expired_trash()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_count integer;
BEGIN
  DELETE FROM public.deleted_items_trash
  WHERE expires_at < now();
  
  GET DIAGNOSTICS _deleted_count = ROW_COUNT;
  RETURN _deleted_count;
END;
$$;