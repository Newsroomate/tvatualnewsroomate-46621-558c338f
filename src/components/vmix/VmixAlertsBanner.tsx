import { AlertTriangle, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVmixAlerts } from '@/hooks/useVmixAlerts';
import { clearVmixAlerts, dismissVmixAlert, VmixAlertKind } from '@/services/vmix-alerts';

const KIND_LABELS: Record<VmixAlertKind, string> = {
  trigger_failed: 'Falha no disparo',
  connection_lost: 'Sem contato com o vMix',
  sync_stalled: 'Sincronização travada',
};

export const VmixAlertsBanner = () => {
  const alerts = useVmixAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="flex-shrink-0 rounded-md border border-destructive/40 bg-destructive/5 p-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {alerts.length} alerta{alerts.length > 1 ? 's' : ''} do vMix
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearVmixAlerts}>
          Limpar todos
        </Button>
      </div>

      <div className="max-h-32 overflow-y-auto space-y-1">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start justify-between gap-2 rounded bg-background/70 px-2 py-1"
          >
            <div className="min-w-0">
              <p className="text-sm text-destructive flex items-center gap-1">
                {alert.kind === 'connection_lost' ? (
                  <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className="font-medium">{KIND_LABELS[alert.kind]}:</span>
                <span className="truncate">{alert.title}</span>
              </p>
              <p className="text-xs text-muted-foreground break-words">
                {alert.createdAt.toLocaleTimeString('pt-BR')}
                {alert.materiaRetranca ? ` · ${alert.materiaRetranca}` : ''}
                {alert.target ? ` · alvo: ${alert.target}` : ''}
                {alert.detail ? ` · ${alert.detail}` : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => dismissVmixAlert(alert.id)}
              aria-label="Dispensar alerta"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
