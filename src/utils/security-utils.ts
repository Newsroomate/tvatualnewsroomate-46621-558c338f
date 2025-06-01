
import { UserProfile } from "@/types/auth";
import { sanitize } from "dompurify";

// Input validation utilities
export const validateTextLength = (text: string, maxLength: number = 1000): boolean => {
  return text.length <= maxLength;
};

export const validateRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

export const sanitizeHtml = (html: string): string => {
  return sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span'],
    ALLOWED_ATTR: []
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Authorization utilities
export const canPerformAction = (
  profile: UserProfile | null,
  action: 'create' | 'update' | 'delete',
  resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho'
): boolean => {
  if (!profile) return false;

  const { role } = profile;

  switch (resource) {
    case 'telejornal':
      if (action === 'create' || action === 'update') {
        return ['editor', 'editor_chefe'].includes(role);
      }
      if (action === 'delete') {
        return role === 'editor_chefe';
      }
      break;

    case 'bloco':
      if (action === 'create' || action === 'update') {
        return ['editor', 'editor_chefe'].includes(role);
      }
      if (action === 'delete') {
        return role === 'editor_chefe';
      }
      break;

    case 'materia':
      if (action === 'create' || action === 'update') {
        return ['reporter', 'editor', 'editor_chefe'].includes(role);
      }
      if (action === 'delete') {
        return role === 'editor_chefe';
      }
      break;

    case 'pauta':
      if (action === 'create') {
        return ['produtor', 'editor_chefe'].includes(role);
      }
      if (action === 'update' || action === 'delete') {
        return ['produtor', 'editor_chefe'].includes(role);
      }
      break;

    case 'espelho':
      if (action === 'create') {
        return ['editor', 'editor_chefe'].includes(role);
      }
      if (action === 'update' || action === 'delete') {
        return role === 'editor_chefe';
      }
      break;
  }

  return false;
};

// Generic error message for security
export const getSecureErrorMessage = (error: any): string => {
  // Don't expose internal error details to users
  if (typeof error === 'string') {
    return error.includes('permission') || error.includes('unauthorized') 
      ? 'Você não tem permissão para realizar esta ação.'
      : 'Ocorreu um erro. Tente novamente.';
  }
  
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

// Input sanitization for forms
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove potential XSS and trim whitespace
      sanitized[key] = sanitizeHtml(value).trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Session timeout check (30 minutes)
export const isSessionExpired = (lastActivity: number): boolean => {
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  return Date.now() - lastActivity > SESSION_TIMEOUT;
};
