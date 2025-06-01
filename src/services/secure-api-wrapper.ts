
import { UserProfile } from "@/types/auth";
import { canPerformAction, getSecureErrorMessage } from "@/utils/security-utils";
import { toast } from "@/hooks/use-toast";

interface SecureApiOptions {
  profile: UserProfile | null;
  action: 'create' | 'update' | 'delete';
  resource: 'telejornal' | 'bloco' | 'materia' | 'pauta' | 'espelho';
  operation: () => Promise<any>;
}

export const executeSecureOperation = async ({
  profile,
  action,
  resource,
  operation
}: SecureApiOptions) => {
  // Check authorization before executing operation
  if (!canPerformAction(profile, action, resource)) {
    const errorMessage = 'Você não tem permissão para realizar esta ação.';
    toast({
      title: "Acesso negado",
      description: errorMessage,
      variant: "destructive",
    });
    throw new Error(errorMessage);
  }

  try {
    console.log(`Executing ${action} operation on ${resource} for user role: ${profile?.role}`);
    return await operation();
  } catch (error) {
    const secureMessage = getSecureErrorMessage(error);
    console.error(`Security-wrapped operation failed:`, {
      action,
      resource,
      userRole: profile?.role,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    toast({
      title: "Erro na operação",
      description: secureMessage,
      variant: "destructive",
    });
    
    throw new Error(secureMessage);
  }
};

// Rate limiting utility (simple in-memory implementation)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(
      attempt => now - attempt < this.windowMs
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true;
  }
}

export const rateLimiter = new RateLimiter();
