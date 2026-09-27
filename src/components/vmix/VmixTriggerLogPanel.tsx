import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { fetchVmixTriggerLogs, VmixTriggerLog } from '@/services/vmix-logs';

interface VmixTriggerLogPanelProps {
  telejornalId?: string | null;
  isActive: boolean;
}

const LINK_TYPE_LABELS: Record<string, string> = {
  input: 'Entrada',
  playlist: 'Playlist',
  preset: 'Preset',
};

const ACTION_LABELS: Record<string, string> = {
  trigger_link: 'Colocar no ar',
  auto_sync: 'Sincronização automática',
};

export const VmixTriggerLogPanel = ({ telejornalId, isActive }: VmixTriggerLogPanelProps) => {
  const [logs, setLogs] = useState<VmixTriggerLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchVmixTriggerLogs(telejornalId);
      setLogs(data);
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível carregar o histórico de disparos');
    } finally {
      setIsLoading(false);
    }
  }, [telejornalId]);

  useEffect(() => {
    if (!isActive) return;
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isActive, load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (filter === 'success' && !log.success) return false;
      if (filter === 'error' && log.success) return false;
      if (!term) return true;
      return [log.materia_retranca, log.target, log.user_name, log.message, log.error_detail]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [logs, filter, search]);

  const errorCount = useMemo(() => logs.filter((l) => !l.success).length, [logs]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0 pb-3">
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>

        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os disparos</SelectItem>
            <SelectItem value="success">Somente com sucesso</SelectItem>
            <SelectItem value="error">Somente com falha</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="h-9 w-64"
          placeholder="Buscar por matéria, alvo ou usuário"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Badge variant="secondary">{logs.length} registros</Badge>
        {errorCount > 0 && <Badge variant="destructive">{errorCount} com falha</Badge>}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum disparo registrado ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                <th className="py-2 pr-2 w-28">Horário</th>
                <th className="py-2 pr-2">Matéria</th>
                <th className="py-2 pr-2">Alvo no vMix</th>
                <th className="py-2 pr-2 w-40">Usuário</th>
                <th className="py-2 pr-2 w-28">Resultado</th>
                <th className="py-2">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const date = new Date(log.created_at);
                return (
                  <tr
                    key={log.id}
                    className={`border-b align-top ${log.success ? '' : 'bg-destructive/5'}`}
                  >
                    <td className="py-2 pr-2 whitespace-nowrap">
                      <div>{date.toLocaleTimeString('pt-BR')}</div>
                      <div className="text-xs text-muted-foreground">
                        {date.toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{log.materia_retranca || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {ACTION_LABELS[log.action] || log.action}
                        {log.duration_ms ? ` · ${log.duration_ms} ms` : ''}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <div>{log.target || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.link_type ? LINK_TYPE_LABELS[log.link_type] || log.link_type : ''}
                        {log.vmix_host ? ` · ${log.vmix_host}:${log.vmix_port ?? ''}` : ''}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="truncate">{log.user_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.source === 'auto' ? 'Automático' : 'Manual'}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      {log.success ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> Sucesso
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-4 w-4" /> Falha
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <div>{log.message || '—'}</div>
                      {log.error_detail && (
                        <div className="text-xs text-destructive break-words">{log.error_detail}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
