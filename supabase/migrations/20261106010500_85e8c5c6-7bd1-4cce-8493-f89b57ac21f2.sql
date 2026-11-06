ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_assigned_by_fkey,
  ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_assigned_by_fkey,
  ADD CONSTRAINT user_permissions_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.espelhos_backup DROP CONSTRAINT IF EXISTS espelhos_backup_created_by_fkey,
  ADD CONSTRAINT espelhos_backup_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.reportagens DROP CONSTRAINT IF EXISTS reportagens_user_id_fkey,
  ADD CONSTRAINT reportagens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.entrevistas DROP CONSTRAINT IF EXISTS entrevistas_user_id_fkey,
  ADD CONSTRAINT entrevistas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.log_permission_change()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_audit_logs (actor_user_id, action, target_user_id, permission_type, details)
    VALUES (COALESCE(NEW.assigned_by, auth.uid(), NEW.user_id),
      CASE WHEN NEW.is_granted THEN 'grant_permission' ELSE 'revoke_permission' END,
      NEW.user_id, NEW.permission,
      jsonb_build_object('permission', NEW.permission::text, 'is_granted', NEW.is_granted));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_logs (actor_user_id, action, target_user_id, permission_type, details)
    VALUES (COALESCE(auth.uid(), NEW.user_id),
      CASE WHEN NEW.is_granted AND NOT OLD.is_granted THEN 'grant_permission'
           WHEN NOT NEW.is_granted AND OLD.is_granted THEN 'revoke_permission'
           ELSE 'update_permission' END,
      NEW.user_id, NEW.permission,
      jsonb_build_object('permission', NEW.permission::text, 'old_is_granted', OLD.is_granted, 'new_is_granted', NEW.is_granted));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit_logs (actor_user_id, action, target_user_id, permission_type, details)
    VALUES (COALESCE(auth.uid(), OLD.user_id), 'remove_permission_override', OLD.user_id, OLD.permission,
      jsonb_build_object('permission', OLD.permission::text, 'was_granted', OLD.is_granted));
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_deletion()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.permission_audit_logs (actor_user_id, action, target_user_id, old_role, details)
  VALUES (COALESCE(auth.uid(), OLD.id), 'delete_user', OLD.id, OLD.role,
    jsonb_build_object('full_name', OLD.full_name, 'role', OLD.role::text, 'deleted_at', now()));
  RETURN OLD;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.log_user_deletion() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS log_profile_deletion ON public.profiles;
CREATE TRIGGER log_profile_deletion BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_user_deletion();