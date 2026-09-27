import { useSyncExternalStore } from 'react';
import { getVmixAlerts, subscribeVmixAlerts } from '@/services/vmix-alerts';

export const useVmixAlerts = () => useSyncExternalStore(subscribeVmixAlerts, getVmixAlerts, getVmixAlerts);
