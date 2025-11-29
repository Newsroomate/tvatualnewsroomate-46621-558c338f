
import { UserProfile } from "@/types/auth";
import DOMPurify from "dompurify";
import { getDefaultRolePermissions } from "@/services/user-permissions-api";

// Input validation utilities
export const validateTextLength = (text: string, maxLength: number = 1000): boolean => {
  return text.length <= maxLength;
};

export const validateRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span'],
    ALLOWED_ATTR: []
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Map action+resource to permission type
const getPermissionType = (
  action: 'create' | 'update' | 'delete' | 'view' | 'export',
  resource: string
): string | null => {
  const permissionMap: Record<string, string> = {
    // Matérias
    'create-materia': 'criar_materia',
    'update-materia': 'editar_materia',
    'delete-materia': 'excluir_materia',
    // Blocos
    'create-bloco': 'criar_bloco',
    'update-bloco': 'editar_bloco',
    'delete-bloco': 'excluir_bloco',
    // Telejornais
    'create-telejornal': 'criar_telejornal',
    'update-telejornal': 'editar_telejornal',
    'delete-telejornal': 'excluir_telejornal',
    // Pautas
    'create-pauta': 'criar_pauta',
    'update-pauta': 'editar_pauta',
    'delete-pauta': 'excluir_pauta',
    'view-pauta': 'visualizar_todas_pautas',
    // Espelhos
    'create-espelho': 'salvar_espelho',
    'update-espelho': 'editar_espelho_salvo',
    'delete-espelho': 'excluir_espelho_salvo',
    'view-espelho': 'visualizar_historico_espelhos',
    // Snapshots
    'create-snapshot': 'criar_snapshot',
    'update-snapshot': 'editar_snapshot',
    'delete-snapshot': 'excluir_snapshots',
    'view-snapshot': 'visualizar_snapshots',
    // Exports
    'export-gc': 'exportar_gc',
    'export-playout': 'exportar_playout',
    'export-lauda': 'exportar_lauda',
    'export-rss': 'exportar_rss',
    'export-clip_retranca': 'exportar_clip_retranca',
    // Views
    'view-lauda': 'visualizar_laudas',
    'view-teleprompter': 'visualizar_teleprompter',
    'view-deep_search': 'busca_profunda',
    'view-historico': 'visualizar_historico_espelhos',
    // Modelos
    'create-modelo': 'salvar_modelo',
    'update-modelo': 'aplicar_modelo',
    'delete-modelo': 'excluir_modelo',
    'view-modelo': 'visualizar_modelos',
  };

  return permissionMap[`${action}-${resource}`] || null;
};

// Authorization utilities with granular permissions support
export const canPerformAction = (
  profile: UserProfile | null,
  action: 'create' | 'update' | 'delete' | 'view' | 'export',
  resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot' | 'gc' | 'playout' | 'lauda' | 'rss' | 'clip_retranca' | 'modelo' | 'teleprompter' | 'deep_search' | 'historico',
  resourceOwnerId?: string,
  userPermissions?: string[] // Effective permissions (with is_granted applied)
): boolean => {
  if (!profile) return false;

  const { role } = profile;
  const isOwner = resourceOwnerId ? profile.id === resourceOwnerId : false;
  const isEditorChefe = role === 'editor_chefe';
  const isEditor = ['editor', 'editor_chefe'].includes(role);

  // CRITICAL: Check granular permissions FIRST
  // userPermissions already contains the effective set (role + overrides with is_granted applied)
  if (userPermissions && userPermissions.length > 0) {
    const requiredPermission = getPermissionType(action, resource);
    if (requiredPermission) {
      const hasPermission = userPermissions.includes(requiredPermission);
      
      // If user has the permission in effective list, grant access
      if (hasPermission) {
        return true;
      }
      
      // If user doesn't have it but role would grant it, it means it was revoked
      const rolePerms = getDefaultRolePermissions(profile.role);
      if (rolePerms.includes(requiredPermission as any)) {
        // Permission was revoked via is_granted=false
        return false;
      }
    }
  }

  // SECOND: Fallback to role-based permissions
  // Handle export actions
  if (action === 'export') {
    // Exports generally require editor or higher permissions
    return isEditor;
  }

  switch (resource) {
    case 'telejornal':
      if (action === 'view') return true;
      if (action === 'create' || action === 'update') {
        return isEditor;
      }
      if (action === 'delete') {
        return isEditorChefe;
      }
      break;

    case 'bloco':
      if (action === 'view') return true;
      if (action === 'create' || action === 'update' || action === 'delete') {
        return isEditor;
      }
      break;

    case 'materia':
      if (action === 'view') return true;
      if (action === 'create' || action === 'update') {
        return ['reporter', 'editor', 'editor_chefe'].includes(role);
      }
      if (action === 'delete') {
        return isEditor;
      }
      break;

    case 'pauta':
      if (action === 'view') return true;
      if (action === 'create') {
        return ['produtor', 'editor_chefe'].includes(role) || isOwner;
      }
      if (action === 'update' || action === 'delete') {
        return ['produtor', 'editor_chefe'].includes(role) || isOwner;
      }
      break;

    case 'espelho':
      if (action === 'view') {
        return isEditor;
      }
      if (action === 'create') {
        return isEditor;
      }
      if (action === 'update' || action === 'delete') {
        return isEditor;
      }
      break;

    case 'snapshot':
      if (action === 'view') {
        return isEditor || isOwner;
      }
      if (action === 'create') {
        return true;
      }
      if (action === 'update' || action === 'delete') {
        return isEditor || isOwner;
      }
      break;
      
    case 'lauda':
      if (action === 'view') {
        return true;
      }
      break;
  }

  return false;
};

// Enhanced error handling with security considerations
export const getSecureErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    if (error.includes('permission') || error.includes('unauthorized') || error.includes('PGRST116')) {
      return 'Você não tem permissão para realizar esta ação.';
    }
    if (error.includes('RLS') || error.includes('policy')) {
      return 'Acesso negado. Verifique suas permissões.';
    }
    return 'Ocorreu um erro. Tente novamente.';
  }
  
  if (error?.code === 'PGRST116') {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

// Enhanced input sanitization for forms
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const sanitizedValue = sanitizeHtml(value).trim();
      if (validateTextLength(sanitizedValue, 10000)) {
        sanitized[key] = sanitizedValue;
      } else {
        console.warn(`Field ${key} exceeds maximum length and was truncated`);
        sanitized[key] = sanitizedValue.substring(0, 10000);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeHtml(item).trim() : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Enhanced session management
export const isSessionExpired = (lastActivity: number): boolean => {
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  return Date.now() - lastActivity > SESSION_TIMEOUT;
};

// Resource ownership validation
export const validateResourceOwnership = (
  profile: UserProfile | null,
  resourceOwnerId: string | null | undefined
): boolean => {
  if (!profile || !resourceOwnerId) return false;
  return profile.id === resourceOwnerId || profile.role === 'editor_chefe';
};

// Audit logging helper
export const logSecurityEvent = (
  event: 'access_denied' | 'unauthorized_attempt' | 'permission_granted',
  resource: string,
  userId?: string,
  details?: Record<string, any>
): void => {
  console.log(`[SECURITY] ${event.toUpperCase()}:`, {
    resource,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Rate limiting helper
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];
  
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  
  return true;
};