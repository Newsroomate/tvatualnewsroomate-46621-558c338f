/**
 * Centralized logging service for clipboard operations
 * Provides detailed diagnostics for troubleshooting copy/paste issues
 */

interface ClipboardLogData {
  operation: 'copy' | 'paste' | 'validate' | 'error';
  type?: 'materia' | 'block';
  data?: any;
  message?: string;
  timestamp?: number;
}

class ClipboardLogger {
  private logs: ClipboardLogData[] = [];
  private maxLogs = 100;

  log(data: ClipboardLogData) {
    const logEntry = {
      ...data,
      timestamp: Date.now()
    };

    this.logs.push(logEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with formatting
    const prefix = this.getLogPrefix(data.operation);
    if (data.operation === 'error') {
      console.error(prefix, data.message, data.data);
    } else {
      console.log(prefix, data.message, data.data);
    }
  }

  private getLogPrefix(operation: string): string {
    const prefixes = {
      copy: '📋 [CLIPBOARD COPY]',
      paste: '📥 [CLIPBOARD PASTE]',
      validate: '✅ [CLIPBOARD VALIDATE]',
      error: '❌ [CLIPBOARD ERROR]'
    };
    return prefixes[operation as keyof typeof prefixes] || '[CLIPBOARD]';
  }

  getLogs(): ClipboardLogData[] {
    return [...this.logs];
  }

  getRecentLogs(count: number = 10): ClipboardLogData[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const clipboardLogger = new ClipboardLogger();

// Helper functions for common log scenarios
export const logCopyMateria = (materia: any) => {
  clipboardLogger.log({
    operation: 'copy',
    type: 'materia',
    message: `Matéria copiada: \"${materia.retranca}\"`,
    data: {
      id: materia.id,
      retranca: materia.retranca,
      bloco_id: materia.bloco_id,
      duracao: materia.duracao,
      fieldsCount: Object.keys(materia).length,
      populatedFields: Object.entries(materia).filter(([_, v]) => v != null && v !== '').length
    }
  });
};

export const logCopyBlock = (block: any, materiasCount: number) => {
  clipboardLogger.log({
    operation: 'copy',
    type: 'block',
    message: `Bloco copiado: \"${block.nome}\" com ${materiasCount} matérias`,
    data: {
      id: block.id,
      nome: block.nome,
      ordem: block.ordem,
      materiasCount
    }
  });
};

export const logPasteStart = (type: 'materia' | 'block', target: any) => {
  clipboardLogger.log({
    operation: 'paste',
    type,
    message: `Iniciando colagem de ${type}`,
    data: {
      targetBlockId: target.targetBlockId,
      insertPosition: target.insertPosition,
      targetBlockName: target.targetBlock?.nome
    }
  });
};

export const logPasteSuccess = (type: 'materia' | 'block', result: any) => {
  clipboardLogger.log({
    operation: 'paste',
    type,
    message: `${type === 'materia' ? 'Matéria' : 'Bloco'} colado com sucesso`,
    data: result
  });
};

export const logPasteError = (type: 'materia' | 'block', error: any) => {
  clipboardLogger.log({
    operation: 'error',
    type,
    message: `Erro ao colar ${type}`,
    data: {
      error: error?.message || String(error),
      stack: error?.stack
    }
  });
};

export const logValidation = (type: string, passed: boolean, reason?: string) => {
  clipboardLogger.log({
    operation: 'validate',
    message: `Validação ${type}: ${passed ? 'PASSOU' : 'FALHOU'}`,
    data: {
      type,
      passed,
      reason
    }
  });
};
