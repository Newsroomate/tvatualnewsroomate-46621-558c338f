
-- 1. Fix has_permission() to respect is_granted column
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission permission_type)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
      AND is_granted = true
  )
$$;

-- 2. Drop all existing viewer_messages policies and replace with scoped ones
DROP POLICY IF EXISTS "Authenticated users can view messages" ON viewer_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON viewer_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON viewer_messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON viewer_messages;

-- SELECT: only messages for telejornais the user can access (or unassigned messages for editors+)
CREATE POLICY "Users can view messages for accessible telejornais"
ON viewer_messages FOR SELECT TO authenticated
USING (
  telejornal_id IS NULL AND has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
  OR telejornal_id IS NOT NULL AND can_access_telejornal(auth.uid(), telejornal_id)
);

-- INSERT: service role only (webhook inserts), but allow authenticated editors
CREATE POLICY "Editors can insert messages"
ON viewer_messages FOR INSERT TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
);

-- UPDATE: only editors with telejornal access
CREATE POLICY "Editors can update messages for accessible telejornais"
ON viewer_messages FOR UPDATE TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

-- DELETE: only editor_chefe
CREATE POLICY "Editor chefe can delete messages"
ON viewer_messages FOR DELETE TO authenticated
USING (
  has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

-- 3. Drop existing vmix_settings policy and replace with scoped ones
DROP POLICY IF EXISTS "Authenticated users can manage vmix settings" ON vmix_settings;

CREATE POLICY "Users can view vmix settings for accessible telejornais"
ON vmix_settings FOR SELECT TO authenticated
USING (
  telejornal_id IS NULL
  OR can_access_telejornal(auth.uid(), telejornal_id)
);

CREATE POLICY "Editors can manage vmix settings for accessible telejornais"
ON vmix_settings FOR INSERT TO authenticated
WITH CHECK (
  has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

CREATE POLICY "Editors can update vmix settings for accessible telejornais"
ON vmix_settings FOR UPDATE TO authenticated
USING (
  has_effective_permission(auth.uid(), 'editar_telejornal'::permission_type)
  AND (telejornal_id IS NULL OR can_access_telejornal(auth.uid(), telejornal_id))
);

CREATE POLICY "Editor chefe can delete vmix settings"
ON vmix_settings FOR DELETE TO authenticated
USING (
  has_effective_permission(auth.uid(), 'gerenciar_permissoes'::permission_type)
);

-- 4. Fix storage policies for viewer-media bucket
DROP POLICY IF EXISTS "Authenticated users can delete viewer media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update viewer media" ON storage.objects;

CREATE POLICY "Editors can delete viewer media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'viewer-media'
  AND has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
);

CREATE POLICY "Editors can update viewer media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'viewer-media'
  AND has_effective_permission(auth.uid(), 'editar_materia'::permission_type)
);
