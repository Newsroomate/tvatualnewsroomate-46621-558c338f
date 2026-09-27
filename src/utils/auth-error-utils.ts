
const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Este email já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
  'For security purposes, you can only request this after': 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
  'Rate limit exceeded': 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
};

const PARTIAL_MATCHES: Array<[string, string]> = [
  ['rate limit', 'Muitas tentativas. Aguarde um momento antes de tentar novamente.'],
  ['not authorized', 'Você não tem permissão para realizar esta ação.'],
  ['security purposes', 'Muitas tentativas. Aguarde um momento antes de tentar novamente.'],
  ['email', 'Erro relacionado ao email. Verifique e tente novamente.'],
];

export function translateAuthError(message: string | undefined | null): string {
  if (!message) return 'Ocorreu um erro. Tente novamente.';

  // Exact match
  if (ERROR_MAP[message]) return ERROR_MAP[message];

  // Partial match
  const lower = message.toLowerCase();
  for (const [partial, translated] of PARTIAL_MATCHES) {
    if (lower.includes(partial)) return translated;
  }

  // If it looks like a hash/opaque code (no spaces, alphanumeric), return generic message
  if (/^[a-f0-9]{16,}$/i.test(message.trim())) {
    return 'Ocorreu um erro na autenticação. Tente novamente.';
  }

  // Fallback: if message is very technical, return generic
  if (message.length > 100 || /^[{[]/.test(message)) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  return message;
}
