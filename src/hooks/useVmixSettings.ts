import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { VmixSettings } from '@/types/vmix';
import { 
  fetchVmixSettings, 
  createVmixSettings, 
  updateVmixSettings,
  testVmixConnection 
} from '@/services/vmix-api';

interface UseVmixSettingsProps {
  telejornalId?: string;
  healthCheckInterval?: number; // ms, 0 to disable
}

const DEFAULT_SETTINGS: Omit<VmixSettings, 'id' | 'telejornal_id' | 'created_at' | 'updated_at'> = {
  vmix_host: '192.168.0.2',
  vmix_port: 8088,
  title_input_name: 'TarjaZAP',
  name_field: 'Nome',
  message_field: 'Mensagem',
  photo_field: 'Foto',
  overlay_number: 1,
  is_active: true
};

export const useVmixSettings = ({ telejornalId, healthCheckInterval = 0 }: UseVmixSettingsProps = {}) => {
  const [settings, setSettings] = useState<VmixSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSettings = useCallback(async () => {
    if (!telejornalId) return;

    try {
      setIsLoading(true);
      const data = await fetchVmixSettings(telejornalId);
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error loading vmix settings:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [telejornalId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async (updates: Partial<VmixSettings>) => {
    if (!telejornalId) return null;

    try {
      setIsSaving(true);
      let result: VmixSettings;

      if (settings?.id) {
        result = await updateVmixSettings(settings.id, updates);
      } else {
        result = await createVmixSettings(telejornalId, updates);
      }

      setSettings(result);
      setError(null);
      return result;
    } catch (err) {
      console.error('Error saving vmix settings:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [telejornalId, settings?.id]);

  const testConnection = useCallback(async () => {
    const host = settings?.vmix_host || DEFAULT_SETTINGS.vmix_host;
    const port = settings?.vmix_port || DEFAULT_SETTINGS.vmix_port;

    try {
      setIsTesting(true);
      const result = await testVmixConnection(host, port);
      const status = result.success ? 'connected' : 'disconnected';
      setConnectionStatus(status);
      setLastHealthCheck(new Date());
      return result;
    } catch (err) {
      console.error('Error testing connection:', err);
      setConnectionStatus('disconnected');
      setLastHealthCheck(new Date());
      throw err;
    } finally {
      setIsTesting(false);
    }
  }, [settings?.vmix_host, settings?.vmix_port]);

  // Periodic health check
  useEffect(() => {
    if (healthCheckInterval <= 0) return;

    const doCheck = async () => {
      const host = settings?.vmix_host || DEFAULT_SETTINGS.vmix_host;
      const port = settings?.vmix_port || DEFAULT_SETTINGS.vmix_port;
      try {
        const result = await testVmixConnection(host, port);
        setConnectionStatus(result.success ? 'connected' : 'disconnected');
        setLastHealthCheck(new Date());
      } catch {
        setConnectionStatus('disconnected');
        setLastHealthCheck(new Date());
      }
    };

    healthCheckRef.current = setInterval(doCheck, healthCheckInterval);
    return () => {
      if (healthCheckRef.current) clearInterval(healthCheckRef.current);
    };
  }, [healthCheckInterval, settings?.vmix_host, settings?.vmix_port]);

  // Stabilized effective settings with useMemo
  const effectiveSettings: VmixSettings = useMemo(() => {
    if (settings) return settings;
    return {
      id: '',
      telejornal_id: telejornalId || null,
      ...DEFAULT_SETTINGS,
      created_at: null,
      updated_at: null
    };
  }, [settings, telejornalId]);

  return {
    settings: effectiveSettings,
    isLoading,
    isSaving,
    isTesting,
    connectionStatus,
    lastHealthCheck,
    error,
    saveSettings,
    testConnection,
    refresh: loadSettings
  };
};
