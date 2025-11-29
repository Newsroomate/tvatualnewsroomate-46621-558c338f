import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { canPerformAction } from "@/utils/security-utils";
import { usePermissionGuardContext } from "@/components/auth/PermissionGuardProvider";

/**
 * Hook for checking permissions with explicit user feedback
 * Prevents false frontend executions by validating BEFORE action
 */
export const usePermissionGuard = () => {
  const { profile, userPermissions } = useAuth();
  const { toast } = useToast();
  const { showPermissionDenied } = usePermissionGuardContext();

  const getPermissionDeniedMessage = (action: string, resource: string): string => {
    const actionMessages: Record<string, string> = {
      'create': 'criar',
      'update': 'editar',
      'delete': 'excluir',
      'view': 'visualizar'
    };

    const resourceMessages: Record<string, string> = {
      'bloco': 'blocos',
      'materia': 'matérias',
      'telejornal': 'telejornais',
      'pauta': 'pautas',
      'espelho': 'espelhos',
      'snapshot': 'snapshots'
    };

    return `Você não tem permissão para ${actionMessages[action] || action} ${resourceMessages[resource] || resource}.`;
  };

  const checkPermission = (
    action: 'create' | 'update' | 'delete' | 'view' | 'export',
    resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot' | 'gc' | 'playout' | 'lauda' | 'rss' | 'clip_retranca',
    resourceOwnerId?: string,
    useDialog: boolean = true
  ): boolean => {
    const hasPermission = canPerformAction(
      profile,
      action,
      resource,
      resourceOwnerId,
      userPermissions
    );

    if (!hasPermission) {
      if (useDialog) {
        showPermissionDenied(action, resource, getPermissionDeniedMessage(action, resource));
      } else {
        toast({
          title: "Permissão Negada",
          description: `${getPermissionDeniedMessage(action, resource)} Entre em contato com o Editor-Chefe do telejornal para solicitar esta permissão.`,
          variant: "destructive",
          duration: 5000,
        });
      }
    }

    return hasPermission;
  };

  const guardAction = async <T,>(
    action: 'create' | 'update' | 'delete' | 'view' | 'export',
    resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot' | 'gc' | 'playout' | 'lauda' | 'rss' | 'clip_retranca',
    callback: () => Promise<T> | T,
    resourceOwnerId?: string,
    useDialog: boolean = true
  ): Promise<T | null> => {
    if (!checkPermission(action, resource, resourceOwnerId, useDialog)) {
      return null;
    }

    try {
      return await callback();
    } catch (error: any) {
      // If backend rejects due to RLS, show specific message
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        if (useDialog) {
          showPermissionDenied(action, resource, `${getPermissionDeniedMessage(action, resource)} Esta ação foi bloqueada pelo sistema de segurança. Entre em contato com o Editor-Chefe.`);
        } else {
          toast({
            title: "Permissão Negada pelo Sistema",
            description: `${getPermissionDeniedMessage(action, resource)} Esta ação foi bloqueada pelo sistema de segurança. Entre em contato com o Editor-Chefe.`,
            variant: "destructive",
            duration: 6000,
          });
        }
        return null;
      }
      throw error;
    }
  };

  return {
    checkPermission,
    guardAction,
  };
};
