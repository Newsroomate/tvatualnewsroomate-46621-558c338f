
-- 1) Restrict telejornal creation to editor_chefe role only
DROP POLICY IF EXISTS "Users with permission can create telejornais" ON public.telejornais;

CREATE POLICY "Only editor_chefe can create telejornais"
ON public.telejornais
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'editor_chefe'::user_role)
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'editor_chefe'::user_role
);

-- 2) Replace hardcoded UUID list in is_trash_manager with a role/permission-based check
CREATE OR REPLACE FUNCTION public.is_trash_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_user_id, 'editor_chefe'::user_role)
    OR public.has_permission(_user_id, 'gerenciar_permissoes'::permission_type)
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id AND role = 'editor_chefe'::user_role
    );
$function$;

-- 3) Make get_current_user_role consistent: prefer user_roles, fall back to profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role::TEXT FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'reporter'
  );
$function$;
