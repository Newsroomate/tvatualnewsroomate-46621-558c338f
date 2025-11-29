import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { canPerformAction } from "@/utils/security-utils";

/**
 * Hook for checking permissions with explicit user feedback
 * Prevents false frontend executions by validating BEFORE action
 */
export const usePermissionGuard = () => {
  const { profile, userPermissions } = useAuth();
  const { toast } = useToast();

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
    action: 'create' | 'update' | 'delete' | 'view',
    resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot',
    resourceOwnerId?: string
  ): boolean => {
    const hasPermission = canPerformAction(
      profile,
      action,
      resource,
      resourceOwnerId,
      userPermissions
    );

    if (!hasPermission) {
      toast({
        title: "Permissão Negada",
        description: `${getPermissionDeniedMessage(action, resource)} Entre em contato com o Editor-Chefe do telejornal para solicitar esta permissão.`,
        variant: "destructive",
        duration: 5000,
      });
    }

    return hasPermission;
  };

  const guardAction = async <T,>(
    action: 'create' | 'update' | 'delete' | 'view',
    resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot',
    callback: () => Promise<T> | T,
    resourceOwnerId?: string
  ): Promise<T | null> => {
    if (!checkPermission(action, resource, resourceOwnerId)) {
      return null;
    }

    try {
      return await callback();
    } catch (error: any) {
      // If backend rejects due to RLS, show specific message
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        toast({
          title: "Permissão Negada pelo Sistema",
          description: `${getPermissionDeniedMessage(action, resource)} Esta ação foi bloqueada pelo sistema de segurança. Entre em contato com o Editor-Chefe.`,
          variant: "destructive",
          duration: 6000,
        });
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
