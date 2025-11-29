-- Fase 1: Adicionar campo is_granted na tabela user_permissions
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS is_granted BOOLEAN NOT NULL DEFAULT true;

-- Atualizar constraint unique para permitir apenas um override por permissão
ALTER TABLE public.user_permissions 
DROP CONSTRAINT IF EXISTS user_permissions_user_id_permission_key;

ALTER TABLE public.user_permissions 
ADD CONSTRAINT user_permissions_user_id_permission_key 
UNIQUE (user_id, permission);

-- Fase 2: Expandir o enum permission_type com 26 novas permissões
-- Nota: Postgres requer ALTER TYPE para adicionar valores ao enum

-- Operações avançadas de matéria
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'duplicar_materia';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'copiar_materia';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'colar_materia';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'reordenar_materias';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'transferir_materias';

-- Operações de bloco
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'copiar_bloco';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'colar_bloco';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'renomear_bloco';

-- Gerenciamento de modelos
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'salvar_modelo';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'aplicar_modelo';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'excluir_modelo';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'visualizar_modelos';

-- Exportações
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'exportar_gc';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'exportar_playout';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'exportar_lauda';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'exportar_clip_retranca';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'exportar_rss';

-- Visualizações e ferramentas
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'visualizar_teleprompter';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'visualizar_laudas';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'busca_profunda';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'visualizar_historico_espelhos';

-- Gerenciamento de espelhos
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'abrir_espelho';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'salvar_espelho';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'editar_espelho_salvo';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'excluir_espelho_salvo';

-- Gerenciamento de snapshots
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'criar_snapshot';
ALTER TYPE public.permission_type ADD VALUE IF NOT EXISTS 'editar_snapshot';

-- Fase 3: Atualizar trigger de auditoria para capturar is_granted
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      CASE 
        WHEN NEW.is_granted THEN 'grant_permission'
        ELSE 'revoke_permission'
      END,
      NEW.user_id,
      NEW.permission,
      jsonb_build_object(
        'permission', NEW.permission::text,
        'is_granted', NEW.is_granted
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.permission_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      permission_type,
      details
    ) VALUES (
      auth.uid(),
      CASE 
        WHEN NEW.is_granted AND NOT OLD.is_granted THEN 'grant_permission'
        WHEN NOT NEW.is_granted AND OLD.is_granted THEN 'revoke_permission'
        ELSE 'update_permission'
      END,
      NEW.user_id,
      NEW.permission,
      jsonb_build_object(
        'permission', NEW.permission::text,
        'old_is_granted', OLD.is_granted,
        'new_is_granted', NEW.is_granted
      )
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
      'remove_permission_override',
      OLD.user_id,
      OLD.permission,
      jsonb_build_object(
        'permission', OLD.permission::text,
        'was_granted', OLD.is_granted
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;