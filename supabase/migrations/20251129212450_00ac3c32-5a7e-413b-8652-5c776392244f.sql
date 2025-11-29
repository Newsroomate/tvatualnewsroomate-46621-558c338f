-- Create audit log table for permission changes
CREATE TABLE IF NOT EXISTS public.permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'grant_permission', 'revoke_permission', 'update_role', 'grant_telejornal_access', 'revoke_telejornal_access', 'update_telejornal_role'
  target_user_id UUID NOT NULL,
  permission_type permission_type,
  old_role user_role,
  new_role user_role,
  telejornal_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_permission_audit_logs_timestamp ON public.permission_audit_logs(timestamp DESC);
CREATE INDEX idx_permission_audit_logs_actor ON public.permission_audit_logs(actor_user_id);
CREATE INDEX idx_permission_audit_logs_target ON public.permission_audit_logs(target_user_id);

-- Enable RLS
ALTER TABLE public.permission_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Editor chefe can view all audit logs"
ON public.permission_audit_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'editor_chefe'::user_role) 
  OR has_permission(auth.uid(), 'gerenciar_permissoes'::permission_type)
);

CREATE POLICY "System can insert audit logs"
ON public.permission_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_user_id);

-- Function to log permission changes
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      permission_type,
      details
    ) VALUES (
      COALESCE(NEW.assigned_by, auth.uid()),
      'grant_permission',
      NEW.user_id,
      NEW.permission,
      jsonb_build_object('permission', NEW.permission::text)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      permission_type,
      details
    ) VALUES (
      auth.uid(),
      'revoke_permission',
      OLD.user_id,
      OLD.permission,
      jsonb_build_object('permission', OLD.permission::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for user_permissions
CREATE TRIGGER log_user_permissions_changes
AFTER INSERT OR DELETE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.log_permission_change();

-- Function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      old_role,
      new_role,
      details
    ) VALUES (
      auth.uid(),
      'update_role',
      NEW.user_id,
      OLD.role,
      NEW.role,
      jsonb_build_object('old_role', OLD.role::text, 'new_role', NEW.role::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for user_roles
CREATE TRIGGER log_user_roles_changes
AFTER UPDATE ON public.user_roles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.log_role_change();

-- Create trigger for profiles role changes
CREATE TRIGGER log_profiles_role_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.log_role_change();

-- Function to log telejornal access changes
CREATE OR REPLACE FUNCTION public.log_telejornal_access_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      auth.uid(),
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
      auth.uid(),
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
      auth.uid(),
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

-- Create trigger for user_telejornal_access
CREATE TRIGGER log_telejornal_access_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_telejornal_access
FOR EACH ROW
EXECUTE FUNCTION public.log_telejornal_access_change();