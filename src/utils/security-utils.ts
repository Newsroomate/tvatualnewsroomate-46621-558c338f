
import { UserProfile } from "@/types/auth";
import DOMPurify from "dompurify";

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
  action: 'create' | 'update' | 'delete' | 'view',
  resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot'
): string | null => {
  const permissionMap: Record<string, string> = {
    'create-materia': 'criar_materia',
    'update-materia': 'editar_materia',
    'delete-materia': 'excluir_materia',
    'create-bloco': 'criar_bloco',
    'update-bloco': 'editar_bloco',
    'delete-bloco': 'excluir_bloco',
    'create-telejornal': 'criar_telejornal',
    'update-telejornal': 'editar_telejornal',
    'delete-telejornal': 'excluir_telejornal',
    'create-pauta': 'criar_pauta',
    'update-pauta': 'editar_pauta',
    'delete-pauta': 'excluir_pauta',
  };

  return permissionMap[`${action}-${resource}`] || null;
};

// Authorization utilities with granular permissions support
export const canPerformAction = (
  profile: UserProfile | null,
  action: 'create' | 'update' | 'delete' | 'view',
  resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho' | 'snapshot',
  resourceOwnerId?: string,
  userPermissions?: string[] // Granular permissions from user_permissions table
): boolean => {
  if (!profile) return false;

  const { role } = profile;

  // Check ownership for user-specific resources
  const isOwner = resourceOwnerId ? profile.id === resourceOwnerId : false;
  const isEditorChefe = role === 'editor_chefe';
  const isEditor = ['editor', 'editor_chefe'].includes(role);

  // FIRST: Check granular permissions if provided
  if (userPermissions && userPermissions.length > 0) {
    const requiredPermission = getPermissionType(action, resource);
    if (requiredPermission && userPermissions.includes(requiredPermission)) {
      return true; // User has explicit permission
    }
  }

  // SECOND: Fallback to role-based permissions
  switch (resource) {
    case 'telejornal':
      if (action === 'view') return true; // All authenticated users can view
      if (action === 'create' || action === 'update') {
        return isEditor;
      }
      if (action === 'delete') {
        return isEditorChefe;
      }
      break;

    case 'bloco':
      if (action === 'view') return true; // All authenticated users can view
      if (action === 'create' || action === 'update' || action === 'delete') {
        return isEditor;
      }
      break;

    case 'materia':
      if (action === 'view') return true; // All authenticated users can view
      if (action === 'create' || action === 'update') {
        return ['reporter', 'editor', 'editor_chefe'].includes(role);
      }
      if (action === 'delete') {
        return isEditor;
      }
      break;

    case 'pauta':
      if (action === 'view') return true; // All authenticated users can view
      if (action === 'create') {
        return ['produtor', 'editor_chefe'].includes(role) || isOwner;
      }
      if (action === 'update' || action === 'delete') {
        return ['produtor', 'editor_chefe'].includes(role) || isOwner;
      }
      break;

    case 'espelho':
      if (action === 'view') {
        return isEditorChefe || isOwner;
      }
      if (action === 'create') {
        return isEditor;
      }
      if (action === 'update' || action === 'delete') {
        return isEditorChefe || isOwner;
      }
      break;

    case 'snapshot':
      if (action === 'view') {
        return isEditor || isOwner;
      }
      if (action === 'create') {
        return true; // All authenticated users can create snapshots
      }
      if (action === 'update' || action === 'delete') {
        return isEditor || isOwner;
      }
      break;
  }

  return false;
};

// Enhanced error handling with security considerations
export const getSecureErrorMessage = (error: any): string => {
  // Don't expose internal error details to users
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
      // Remove potential XSS, trim whitespace, and validate length
      const sanitizedValue = sanitizeHtml(value).trim();
      if (validateTextLength(sanitizedValue, 10000)) { // Increased limit for content fields
        sanitized[key] = sanitizedValue;
      } else {
        console.warn(`Field ${key} exceeds maximum length and was truncated`);
        sanitized[key] = sanitizedValue.substring(0, 10000);
      }
    } else if (Array.isArray(value)) {
      // Sanitize array elements
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
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  return Date.now() - lastActivity > SESSION_TIMEOUT;
};

// New: Resource ownership validation
export const validateResourceOwnership = (
  profile: UserProfile | null,
  resourceOwnerId: string | null | undefined
): boolean => {
  if (!profile || !resourceOwnerId) return false;
  return profile.id === resourceOwnerId || profile.role === 'editor_chefe';
};

// New: Audit logging helper
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

// New: Rate limiting helper (client-side basic implementation)
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  
  return true; // Request allowed
};
