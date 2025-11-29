import { useAuth } from "@/context/AuthContext";
import { canPerformAction } from "@/utils/security-utils";

/**
 * Hook for checking permissions with granular permissions support
 * 
 * Usage:
 * const { canCreate, canUpdate, canDelete } = usePermissionCheck();
 * 
 * if (canCreate('bloco')) {
 *   // User can create blocks
 * }
 */
export const usePermissionCheck = () => {
  const { profile, userPermissions } = useAuth();

  const can = (
    action: 'create' | 'update' | 'delete' | 'view',
    resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot',
    resourceOwnerId?: string
  ): boolean => {
    return canPerformAction(profile, action, resource, resourceOwnerId, userPermissions);
  };

  const canCreate = (resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot') => 
    can('create', resource);
  
  const canUpdate = (resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot', ownerId?: string) => 
    can('update', resource, ownerId);
  
  const canDelete = (resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot', ownerId?: string) => 
    can('delete', resource, ownerId);
  
  const canView = (resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot', ownerId?: string) => 
    can('view', resource, ownerId);

  return {
    can,
    canCreate,
    canUpdate,
    canDelete,
    canView,
  };
};
