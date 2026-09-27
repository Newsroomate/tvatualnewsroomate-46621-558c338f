import { toast } from 'sonner';

export type VmixAlertKind = 'trigger_failed' | 'connection_lost' | 'sync_stalled';

export interface VmixAlert {
  id: string;
  kind: VmixAlertKind;
  title: string;
  detail?: string | null;
  materiaRetranca?: string | null;
  target?: string | null;
  createdAt: Date;
}

const MAX_ALERTS = 30;

let alerts: VmixAlert[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

export const subscribeVmixAlerts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getVmixAlerts = () => alerts;

interface PushInput {
  kind: VmixAlertKind;
  title: string;
  detail?: string | null;
  materiaRetranca?: string | null;
  target?: string | null;
  /** Evita repetir o mesmo alerta enquanto ele ainda estiver na lista. */
  dedupeKey?: string;
  silent?: boolean;
}

const dedupeKeys = new Map<string, string>();

export const pushVmixAlert = ({
  kind,
  title,
  detail,
  materiaRetranca,
  target,
  dedupeKey,
  silent,
}: PushInput) => {
  if (dedupeKey && dedupeKeys.has(dedupeKey)) return;

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const alert: VmixAlert = {
    id,
    kind,
    title,
    detail: detail ?? null,
    materiaRetranca: materiaRetranca ?? null,
    target: target ?? null,
    createdAt: new Date(),
  };

  alerts = [alert, ...alerts].slice(0, MAX_ALERTS);
  if (dedupeKey) dedupeKeys.set(dedupeKey, id);
  emit();

  if (!silent) {
    toast.error(title, {
      description: [materiaRetranca ? `Matéria: ${materiaRetranca}` : null, detail]
        .filter(Boolean)
        .join(' · ') || undefined,
      duration: 10000,
    });
  }
};

export const clearVmixAlertsByKey = (dedupeKey: string) => {
  const id = dedupeKeys.get(dedupeKey);
  dedupeKeys.delete(dedupeKey);
  if (!id) return;
  alerts = alerts.filter((a) => a.id !== id);
  emit();
};

export const dismissVmixAlert = (id: string) => {
  alerts = alerts.filter((a) => a.id !== id);
  for (const [key, value] of dedupeKeys.entries()) {
    if (value === id) dedupeKeys.delete(key);
  }
  emit();
};

export const clearVmixAlerts = () => {
  alerts = [];
  dedupeKeys.clear();
  emit();
};

export const notifyVmixRecovered = (dedupeKey: string, message: string) => {
  if (!dedupeKeys.has(dedupeKey)) return;
  clearVmixAlertsByKey(dedupeKey);
  toast.success(message);
};
