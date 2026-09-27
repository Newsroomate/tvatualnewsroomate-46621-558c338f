import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, RefreshCw, Radio, Link2, AlertTriangle } from 'lucide-react';
import { Bloco, Materia, Telejornal } from '@/types';
import { VmixInputInfo, VmixLinkType } from '@/types/vmix';
import { useVmixSettings } from '@/hooks/useVmixSettings';
import { useVmixRundownSync } from '@/hooks/useVmixRundownSync';
import { fetchVmixState, triggerVmixLink } from '@/services/vmix-api';
import { updateMateria } from '@/services/materias-update';
import { logVmixTrigger } from '@/services/vmix-logs';
import { VmixTriggerLogPanel } from './VmixTriggerLogPanel';
import { VmixAlertsBanner } from './VmixAlertsBanner';
import { useVmixAlerts } from '@/hooks/useVmixAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VmixRundownLinkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  telejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[] })[];
}

const LINK_TYPE_LABELS: Record<VmixLinkType, string> = {
  input: 'Entrada',
  playlist: 'Playlist',
  preset: 'Preset',
};

export const VmixRundownLinkPanel = ({ isOpen, onClose, telejornal, blocks }: VmixRundownLinkPanelProps) => {
  const queryClient = useQueryClient();
  const { settings } = useVmixSettings({ telejornalId: telejornal?.id });

  const [inputs, setInputs] = useState<VmixInputInfo[]>([]);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { type: VmixLinkType; target: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('links');
  const alerts = useVmixAlerts();

  const materias = useMemo(
    () => blocks.flatMap((b) => b.items.map((item) => ({ item, blocoNome: b.nome }))),
    [blocks]
  );

  const allMaterias = useMemo(() => materias.map((m) => m.item), [materias]);

  const { activeTitle, onAirMateriaId, isReachable: syncReachable, lastSyncAt } = useVmixRundownSync({
    telejornalId: telejornal?.id,
    materias: allMaterias,
    settings,
    enabled: isOpen && syncEnabled,
  });

  const loadState = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const state = await fetchVmixState(settings.vmix_host, settings.vmix_port);
      setReachable(!!state.reachable);
      setInputs(state.inputs || []);
      setPlaylists(state.playlists || []);
      if (!state.reachable) toast.error(state.message);
    } catch (e) {
      setReachable(false);
      toast.error('Não foi possível ler as entradas do vMix');
    } finally {
      setIsLoadingState(false);
    }
  }, [settings.vmix_host, settings.vmix_port]);

  useEffect(() => {
    if (isOpen) loadState();
  }, [isOpen, loadState]);

  const getDraft = (item: Materia) =>
    drafts[item.id] || {
      type: (item.vmix_link_type as VmixLinkType) || 'input',
      target: item.vmix_target || '',
    };

  const setDraft = (item: Materia, patch: Partial<{ type: VmixLinkType; target: string }>) => {
    const current = getDraft(item);
    setDrafts((prev) => ({ ...prev, [item.id]: { ...current, ...patch } }));
  };

  const handleSave = async (item: Materia) => {
    const draft = getDraft(item);
    setSavingId(item.id);
    try {
      await updateMateria(item.id, {
        retranca: item.retranca,
        vmix_link_type: draft.target ? draft.type : null,
        vmix_target: draft.target || null,
      } as Partial<Materia>);
      await queryClient.invalidateQueries({ queryKey: ['blocos'] });
      await queryClient.refetchQueries({ queryKey: ['blocos'] });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      toast.success('Vínculo com o vMix salvo');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível salvar o vínculo');
    } finally {
      setSavingId(null);
    }
  };

  const handleTrigger = async (item: Materia) => {
    const draft = getDraft(item);
    if (!draft.target) {
      toast.error('Vincule esta matéria a uma entrada do vMix primeiro');
      return;
    }
    setTriggeringId(item.id);
    const startedAt = Date.now();
    try {
      const result = await triggerVmixLink(settings, draft.type, draft.target);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      await logVmixTrigger({
        materiaId: item.id,
        materiaRetranca: item.retranca,
        telejornalId: telejornal?.id ?? null,
        action: 'trigger_link',
        linkType: draft.type,
        target: draft.target,
        success: !!result.success,
        message: result.message,
        errorDetail: result.success ? null : (result as { error?: string }).error ?? null,
        vmixHost: settings.vmix_host,
        vmixPort: settings.vmix_port,
        durationMs: Date.now() - startedAt,
        source: 'manual',
      });
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível acionar o vMix');
      await logVmixTrigger({
        materiaId: item.id,
        materiaRetranca: item.retranca,
        telejornalId: telejornal?.id ?? null,
        action: 'trigger_link',
        linkType: draft.type,
        target: draft.target,
        success: false,
        message: 'Não foi possível acionar o vMix',
        errorDetail: e instanceof Error ? e.message : String(e),
        vmixHost: settings.vmix_host,
        vmixPort: settings.vmix_port,
        durationMs: Date.now() - startedAt,
        source: 'manual',
      });
    } finally {
      setTriggeringId(null);
    }
  };

  const optionsFor = (type: VmixLinkType) =>
    type === 'playlist' ? playlists : inputs.map((i) => i.title).filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-600" />
            Espelho x vMix — {telejornal?.nome || 'Telejornal'}
          </DialogTitle>
        </DialogHeader>

        <VmixAlertsBanner />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 self-start">
          <TabsTrigger value="links">Vínculos</TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2">
            Monitoramento de disparos
            {alerts.length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="flex-1 flex flex-col min-h-0 mt-3 data-[state=inactive]:hidden">
        <div className="flex flex-wrap items-center gap-4 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={loadState} disabled={isLoadingState}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingState ? 'animate-spin' : ''}`} />
            Atualizar entradas do vMix
          </Button>

          <div className="flex items-center gap-2">
            <Switch id="vmix-sync" checked={syncEnabled} onCheckedChange={setSyncEnabled} />
            <Label htmlFor="vmix-sync" className="cursor-pointer">
              Sincronizar status automaticamente
            </Label>
          </div>

          {reachable === false && (
            <span className="flex items-center gap-1 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              vMix não respondeu em {settings.vmix_host}:{settings.vmix_port}
            </span>
          )}

          {reachable && (
            <Badge variant="secondary">
              {inputs.length} entradas • {playlists.length} playlists
            </Badge>
          )}

          {syncEnabled && (
            <span className="text-sm text-muted-foreground">
              {syncReachable === false
                ? 'Sem contato com o vMix'
                : `No ar no vMix: ${activeTitle || '—'}${lastSyncAt ? ` (${lastSyncAt.toLocaleTimeString('pt-BR')})` : ''}`}
            </span>
          )}
        </div>

        <Separator className="flex-shrink-0" />

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {materias.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma matéria no espelho.</p>
          )}

          {materias.map(({ item, blocoNome }) => {
            const draft = getDraft(item);
            const isDirty =
              draft.type !== ((item.vmix_link_type as VmixLinkType) || 'input') ||
              draft.target !== (item.vmix_target || '');
            const options = optionsFor(draft.type);
            const isOnAir = onAirMateriaId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-md border p-3 ${isOnAir ? 'border-green-500 bg-green-50' : 'border-border'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.pagina ? `${item.pagina} · ` : ''}
                      {item.retranca || 'Sem título'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {blocoNome}
                      {item.clip ? ` · clip: ${item.clip}` : ''}
                    </p>
                  </div>
                  {isOnAir && <Badge className="bg-green-600">NO AR</Badge>}
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div className="w-36">
                    <Label className="text-xs">Tipo de vínculo</Label>
                    <Select
                      value={draft.type}
                      onValueChange={(v) => setDraft(item, { type: v as VmixLinkType })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(LINK_TYPE_LABELS) as VmixLinkType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {LINK_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <Label className="text-xs">
                      {draft.type === 'preset' ? 'Caminho do preset no computador do vMix' : 'Nome no vMix'}
                    </Label>
                    <Input
                      className="h-9"
                      value={draft.target}
                      list={`vmix-options-${item.id}`}
                      placeholder={
                        draft.type === 'preset'
                          ? 'C:\\vMix\\presets\\abertura.vmix'
                          : 'Selecione ou digite o nome'
                      }
                      onChange={(e) => setDraft(item, { target: e.target.value })}
                    />
                    {draft.type !== 'preset' && (
                      <datalist id={`vmix-options-${item.id}`}>
                        {options.map((o) => (
                          <option key={o} value={o} />
                        ))}
                      </datalist>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(item)}
                    disabled={!isDirty || savingId === item.id}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Salvar vínculo
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleTrigger(item)}
                    disabled={!draft.target || triggeringId === item.id}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Colocar no ar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        </TabsContent>

        <TabsContent value="monitor" className="flex-1 min-h-0 mt-3 data-[state=inactive]:hidden">
          <VmixTriggerLogPanel telejornalId={telejornal?.id} isActive={isOpen && activeTab === 'monitor'} />
        </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
