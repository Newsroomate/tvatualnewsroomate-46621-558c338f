import { VmixSettings, VmixCommand, VmixResponse, ActiveServer } from '@/types/vmix';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VMIX_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vmix-control`;

// Track which server is active per telejornal
const activeServers = new Map<string, ActiveServer>();
let failoverListeners: Array<(settingsId: string, server: ActiveServer) => void> = [];

export const getActiveServer = (settingsId: string): ActiveServer => {
  return activeServers.get(settingsId) || 'primary';
};

export const onFailoverChange = (listener: (settingsId: string, server: ActiveServer) => void) => {
  failoverListeners.push(listener);
  return () => {
    failoverListeners = failoverListeners.filter(l => l !== listener);
  };
};

const notifyFailover = (settingsId: string, server: ActiveServer) => {
  activeServers.set(settingsId, server);
  failoverListeners.forEach(l => l(settingsId, server));
};

/** Get the host/port for the currently active server */
export const getActiveHostPort = (settings: VmixSettings): { host: string; port: number } => {
  const active = getActiveServer(settings.id);
  if (active === 'backup' && settings.backup_vmix_host) {
    return {
      host: settings.backup_vmix_host,
      port: settings.backup_vmix_port || settings.vmix_port,
    };
  }
  return { host: settings.vmix_host, port: settings.vmix_port };
};

async function rawCallVmix(command: VmixCommand): Promise<VmixResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Usuário não autenticado');

  const response = await fetch(VMIX_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao comunicar com vMix');
  }

  return response.json();
}

/**
 * Send a vMix command with automatic failover.
 * If the primary server fails and failover is enabled, retries on backup.
 * If backup also fails, throws.
 */
export async function callVmixWithFailover(
  settings: VmixSettings,
  buildCommand: (host: string, port: number) => VmixCommand
): Promise<VmixResponse> {
  const failoverEnabled = settings.failover_enabled && settings.backup_vmix_host;
  const active = getActiveServer(settings.id);

  // Determine order of servers to try
  const servers: Array<{ host: string; port: number; label: ActiveServer }> = [];

  if (active === 'primary') {
    servers.push({ host: settings.vmix_host, port: settings.vmix_port, label: 'primary' });
    if (failoverEnabled) {
      servers.push({
        host: settings.backup_vmix_host!,
        port: settings.backup_vmix_port || settings.vmix_port,
        label: 'backup',
      });
    }
  } else {
    // Already on backup — try backup first, then primary
    if (failoverEnabled) {
      servers.push({
        host: settings.backup_vmix_host!,
        port: settings.backup_vmix_port || settings.vmix_port,
        label: 'backup',
      });
    }
    servers.push({ host: settings.vmix_host, port: settings.vmix_port, label: 'primary' });
  }

  let lastError: Error | null = null;

  for (const server of servers) {
    try {
      const command = buildCommand(server.host, server.port);
      const result = await rawCallVmix(command);

      // If we switched servers, notify
      if (server.label !== active) {
        notifyFailover(settings.id, server.label);
        const serverName = server.label === 'primary' ? 'Primário' : 'Backup';
        toast.warning(`vMix failover: usando servidor ${serverName}`, {
          description: `${server.host}:${server.port}`,
          duration: 5000,
        });
      }

      return result;
    } catch (err) {
      lastError = err as Error;
      console.warn(`vMix ${server.label} server failed (${server.host}:${server.port}):`, err);
    }
  }

  throw lastError || new Error('Todos os servidores vMix falharam');
}

/** Force switch to a specific server */
export const forceServer = (settingsId: string, server: ActiveServer) => {
  notifyFailover(settingsId, server);
};
