-- Corrigir trigger log_telejornal_access_change para funcionar sem auth context
CREATE OR REPLACE FUNCTION public.log_telejornal_access_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      telejornal_id,
      new_role,
      details
    ) VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      'grant_telejornal_access',
      NEW.user_id,
      NEW.telejornal_id,
      NEW.role,
      jsonb_build_object('telejornal_id', NEW.telejornal_id::text, 'role', NEW.role::text)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      telejornal_id,
      old_role,
      new_role,
      details
    ) VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      'update_telejornal_role',
      NEW.user_id,
      NEW.telejornal_id,
      OLD.role,
      NEW.role,
      jsonb_build_object('telejornal_id', NEW.telejornal_id::text, 'old_role', OLD.role::text, 'new_role', NEW.role::text)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      telejornal_id,
      old_role,
      details
    ) VALUES (
      COALESCE(auth.uid(), OLD.user_id),
      'revoke_telejornal_access',
      OLD.user_id,
      OLD.telejornal_id,
      OLD.role,
      jsonb_build_object('telejornal_id', OLD.telejornal_id::text, 'role', OLD.role::text)
    );
  END IF;
  RETURN NEW;
END;
$$;