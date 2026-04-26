import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bloco, Materia, Telejornal } from "@/types";
import { Play, Square, SkipBack, SkipForward, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchPlayoutStatus, fetchPlayoutTriggers, subscribePlayoutStatus, upsertPlayoutStatus } from "@/services/playout-api";
import { fetchVmixSettings } from "@/services/vmix-api";
import { PlayoutStatus } from "@/types/playout";
import { toast } from "sonner";

interface PlayoutDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[] })[];
}

const formatHMS = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

const callVmixCommand = async (host: string, port: number, query: string) => {
  // Best-effort GET to vMix HTTP API. May fail if not on local network.
  const url = `http://${host}:${port}/api?${query}`;
  try {
    await fetch(url, { method: 'GET', mode: 'no-cors' });
  } catch (e) {
    console.warn('vMix command failed', e);
  }
};

export const PlayoutDashboard = ({ isOpen, onClose, currentTelejornal, blocks }: PlayoutDashboardProps) => {
  const [status, setStatus] = useState<PlayoutStatus | null>(null);
  const [vmixEnabled, setVmixEnabled] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [navIndex, setNavIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => blocks.flatMap((b) => b.items).sort((a, b) => a.ordem - b.ordem), [blocks]);

  // Compute timecodes
  const baseTime = useMemo(() => {
    const horario = currentTelejornal?.horario;
    if (!horario) return null;
    const m = /^(\d{1,2}):(\d{2})/.exec(horario);
    if (!m) return null;
    const d = new Date();
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
    return d;
  }, [currentTelejornal]);

  const tcByIndex = useMemo(() => {
    const arr: string[] = [];
    let acc = 0;
    for (let i = 0; i < items.length; i++) {
      if (baseTime) {
        const d = new Date(baseTime.getTime() + acc * 1000);
        arr.push(d.toTimeString().slice(0, 8));
      } else {
        arr.push(formatHMS(acc));
      }
      acc += items[i].duracao || 0;
    }
    return arr;
  }, [items, baseTime]);

  // Real-time clock
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [isOpen]);

  // Load + subscribe status
  useEffect(() => {
    if (!isOpen || !currentTelejornal) return;
    fetchPlayoutStatus(currentTelejornal.id).then(setStatus).catch(() => {});
    const unsub = subscribePlayoutStatus(currentTelejornal.id, (s) => setStatus(s));
    return () => {
      unsub();
    };
  }, [isOpen, currentTelejornal]);

  const currentIdx = useMemo(() => {
    if (!status?.current_materia_id) return -1;
    return items.findIndex((m) => m.id === status.current_materia_id);
  }, [items, status]);

  const totalDur = useMemo(() => items.reduce((acc, it) => acc + (it.duracao || 0), 0), [items]);

  const elapsedProg = status?.started_at ? Math.floor((now - new Date(status.started_at).getTime()) / 1000) : 0;
  const itemElapsed = status?.current_item_started_at ? Math.floor((now - new Date(status.current_item_started_at).getTime()) / 1000) : 0;
  const itemRemaining = currentIdx >= 0 ? Math.max(0, (items[currentIdx]?.duracao || 0) - itemElapsed) : 0;

  const fireTriggers = useCallback(
    async (materiaId: string, when: 'on_take' | 'on_finish') => {
      if (!vmixEnabled || !currentTelejornal) return;
      try {
        const triggers = await fetchPlayoutTriggers(materiaId);
        const settings: any = await fetchVmixSettings(currentTelejornal.id);
        for (const t of triggers) {
          if (t.execute_at !== when && !(when === 'on_take' && t.execute_at === 'after_delay')) continue;
          const run = async () => {
            if (t.trigger_type === 'vmix_command' && settings) {
              const cmd = (t.trigger_data as any)?.command;
              if (cmd) await callVmixCommand(settings.vmix_host, settings.vmix_port, cmd);
            }
          };
          if (t.execute_at === 'after_delay' && t.offset_ms > 0) {
            setTimeout(run, t.offset_ms);
          } else {
            run();
          }
        }
      } catch (e) {
        console.warn('triggers failed', e);
      }
    },
    [vmixEnabled, currentTelejornal]
  );

  const updateStatus = async (patch: Partial<PlayoutStatus>) => {
    if (!currentTelejornal) return;
    try {
      const next = await upsertPlayoutStatus(currentTelejornal.id, patch as any);
      setStatus(next);
    } catch (e: any) {
      toast.error('Erro no playout', { description: e?.message });
    }
  };

  const start = async (fromIdx?: number) => {
    if (items.length === 0) return;
    const idx = typeof fromIdx === 'number' && fromIdx >= 0 && fromIdx < items.length ? fromIdx : 0;
    const target = items[idx];
    await updateStatus({
      status: 'running',
      started_at: new Date().toISOString(),
      current_item_started_at: new Date().toISOString(),
      current_materia_id: target.id,
    });
    setNavIndex(idx);
    fireTriggers(target.id, 'on_take');
  };

  // Botão unificado "GO LIVE":
  // - idle/parado → inicia do item selecionado (navIndex) ou do primeiro
  // - running → executa TAKE no próximo item (ao vivo)
  const goLive = async () => {
    if (items.length === 0) return;
    if (status?.status === 'running') {
      const nextIdx = Math.min(items.length - 1, (currentIdx >= 0 ? currentIdx : -1) + 1);
      if (nextIdx === currentIdx) {
        toast.info('Último item da playlist');
        return;
      }
      await take(nextIdx);
      toast.success('TAKE ao vivo', { description: items[nextIdx]?.retranca || '' });
    } else {
      const startIdx = navIndex >= 0 && navIndex < items.length ? navIndex : 0;
      await start(startIdx);
      toast.success('NO AR', { description: items[startIdx]?.retranca || '' });
    }
  };
  const stop = async () => {
    await updateStatus({ status: 'idle', current_materia_id: null, current_item_started_at: null });
  };
  const take = async (idx: number) => {
    if (idx < 0 || idx >= items.length) return;
    if (currentIdx >= 0 && items[currentIdx]) fireTriggers(items[currentIdx].id, 'on_finish');
    const m = items[idx];
    await updateStatus({
      status: 'running',
      current_materia_id: m.id,
      current_item_started_at: new Date().toISOString(),
      started_at: status?.started_at || new Date().toISOString(),
    });
    setNavIndex(idx);
    fireTriggers(m.id, 'on_take');
  };
  const next = () => take(Math.min(items.length - 1, (currentIdx >= 0 ? currentIdx : -1) + 1));
  const prev = () => take(Math.max(0, (currentIdx >= 0 ? currentIdx : 0) - 1));

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')) return;
      if (e.key === 'g' || e.key === 'G') { e.preventDefault(); goLive(); }
      else if (e.key === 's' || e.key === 'S') { e.preventDefault(); start(0); }
      else if (e.key === ' ') { e.preventDefault(); stop(); }
      else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); next(); }
      else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setNavIndex((i) => Math.min(items.length - 1, i + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setNavIndex((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); take(navIndex); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items, navIndex, currentIdx, status]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-rose-600" /> Playout — {currentTelejornal?.nome || 'Telejornal'}
            </DialogTitle>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Switch checked={vmixEnabled} onCheckedChange={setVmixEnabled} id="vmix-toggle" />
                <Label htmlFor="vmix-toggle">vMix</Label>
              </div>
              <div>Programa: <strong className="font-mono">{formatHMS(elapsedProg)}</strong></div>
              <div>Previsto: <strong className="font-mono">{formatHMS(totalDur)}</strong></div>
              <div className={cn(itemRemaining <= 5 && status?.status === 'running' && 'text-rose-600 font-bold')}>
                Restante: <strong className="font-mono">{formatHMS(itemRemaining)}</strong>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <Button
              onClick={goLive}
              size="lg"
              className={cn(
                "font-bold tracking-wide shadow-md",
                status?.status === 'running'
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
              )}
            >
              <Radio className="h-5 w-5 mr-2" />
              {status?.status === 'running' ? 'GO LIVE — TAKE (G)' : 'GO LIVE (G)'}
            </Button>
            <div className="w-px h-8 bg-border mx-1" />
            <Button onClick={() => start(0)} variant="outline" size="sm"><Play className="h-4 w-4 mr-1" /> START topo (S)</Button>
            <Button onClick={stop} variant="destructive" size="sm"><Square className="h-4 w-4 mr-1" /> STOP (Espaço)</Button>
            <Button onClick={prev} variant="outline" size="sm"><SkipBack className="h-4 w-4 mr-1" /> PREV (A)</Button>
            <Button onClick={next} variant="outline" size="sm"><SkipForward className="h-4 w-4 mr-1" /> NEXT (D)</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-background text-xs">
            <span className="text-muted-foreground font-medium mr-1">Atalhos:</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600/10 text-rose-700 border border-rose-600/30">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">G</kbd>
              GO LIVE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">S</kbd>
              START
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">Espaço</kbd>
              STOP
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">D</kbd>
              PRÓXIMO
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">A</kbd>
              ANTERIOR
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">Enter</kbd>
              TAKE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted border">
              <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-foreground text-background text-[10px]">↑ ↓</kbd>
              Navegar
            </span>
          </div>
          <div ref={containerRef} className="flex-1 overflow-auto p-3">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left">
                  <th className="p-2 w-12">#</th>
                  <th className="p-2 w-24">TC</th>
                  <th className="p-2">Retranca</th>
                  <th className="p-2 w-24">Tipo</th>
                  <th className="p-2 w-20 text-right">Dur</th>
                  <th className="p-2 w-28">Status</th>
                  <th className="p-2 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m, i) => {
                  const isCurrent = i === currentIdx;
                  const isNavSel = i === navIndex;
                  const isNext = i === currentIdx + 1;
                  let stateLabel = 'ESPERA';
                  let stateClass = 'text-muted-foreground';
                  if (currentIdx >= 0 && i < currentIdx) { stateLabel = 'EXIBIDO'; stateClass = 'text-emerald-600'; }
                  if (isNext && status?.status === 'running') { stateLabel = 'PRÓXIMO'; stateClass = 'text-amber-600 font-semibold'; }
                  if (isCurrent && status?.status === 'running') { stateLabel = 'NO AR'; stateClass = 'text-rose-600 font-bold animate-pulse'; }
                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        "border-b cursor-pointer",
                        isCurrent && status?.status === 'running' && 'bg-rose-50',
                        isNavSel && !isCurrent && 'bg-muted'
                      )}
                      onClick={() => setNavIndex(i)}
                      onDoubleClick={() => take(i)}
                    >
                      <td className="p-2 font-mono">{m.ordem}</td>
                      <td className="p-2 font-mono text-xs">{tcByIndex[i]}</td>
                      <td className="p-2">{m.retranca || 'Sem título'}</td>
                      <td className="p-2 text-xs">{m.tipo_material || '-'}</td>
                      <td className="p-2 text-right font-mono">{formatHMS(m.duracao || 0)}</td>
                      <td className={cn("p-2", stateClass)}>{stateLabel}</td>
                      <td className="p-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); take(i); }}>
                          TAKE
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma matéria no espelho.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
