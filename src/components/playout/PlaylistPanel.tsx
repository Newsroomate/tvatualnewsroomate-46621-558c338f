import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bloco, Materia, Telejornal } from "@/types";
import { PlaylistItem, PlaylistItemStatus } from "@/types/playlist";
import { deletePlaylistItem, fetchPlaylistItems, generatePlaylistFromBlocks, setPlaylistItemStatus, subscribePlaylist } from "@/services/playlist-api";
import { Film, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PlaylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[] })[];
}

const STATUS_COLOR: Record<PlaylistItemStatus, string> = {
  espera: 'text-muted-foreground',
  pronto: 'text-emerald-600',
  no_ar: 'text-rose-600 font-bold animate-pulse',
  exibido: 'text-slate-500',
  erro: 'text-amber-600',
};

const STATUS_LABEL: Record<PlaylistItemStatus, string> = {
  espera: 'Espera',
  pronto: 'Pronto',
  no_ar: 'NO AR',
  exibido: 'Exibido',
  erro: 'Erro',
};

export const PlaylistPanel = ({ isOpen, onClose, currentTelejornal, blocks }: PlaylistPanelProps) => {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const reload = async () => {
    if (!currentTelejornal) return;
    const list = await fetchPlaylistItems(currentTelejornal.id);
    setItems(list);
  };

  useEffect(() => {
    if (!isOpen || !currentTelejornal) return;
    reload();
    const unsub = subscribePlaylist(currentTelejornal.id, () => reload());
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentTelejornal]);

  // Auto-regenerate when blocks structure changes (and not empty)
  const blocksKey = useMemo(
    () => blocks.map((b) => b.id + ':' + b.items.map((i) => `${i.id}.${i.ordem}.${i.clip || ''}`).join(',')).join('|'),
    [blocks]
  );
  useEffect(() => {
    if (!isOpen || !currentTelejornal) return;
    let cancelled = false;
    (async () => {
      try {
        await generatePlaylistFromBlocks(currentTelejornal.id, blocks);
        if (!cancelled) setLastSync(new Date());
      } catch (e) {
        console.warn('playlist auto-sync', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocksKey, isOpen, currentTelejornal?.id]);

  const onTake = async (it: PlaylistItem) => {
    try {
      // Mark current as exibido, this as no_ar
      const updates = items.map(async (p) => {
        if (p.id === it.id) return setPlaylistItemStatus(p.id, 'no_ar');
        if (p.status === 'no_ar') return setPlaylistItemStatus(p.id, 'exibido');
        return Promise.resolve();
      });
      await Promise.all(updates);
    } catch (e: any) {
      toast.error('Erro no TAKE', { description: e?.message });
    }
  };

  const regenerate = async () => {
    if (!currentTelejornal) return;
    try {
      await generatePlaylistFromBlocks(currentTelejornal.id, blocks);
      setLastSync(new Date());
      toast.success('Playlist regenerada');
    } catch (e: any) {
      toast.error('Erro ao regenerar', { description: e?.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Film className="h-5 w-5" /> Playlist de Mídia</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <div>
            {lastSync ? `Sincronizado às ${lastSync.toTimeString().slice(0, 8)}` : 'Aguardando sincronização...'}
          </div>
          <Button size="sm" variant="outline" onClick={regenerate}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerar
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b text-left">
                <th className="p-2 w-12">#</th>
                <th className="p-2">Título</th>
                <th className="p-2">Clip</th>
                <th className="p-2 w-20">Tipo</th>
                <th className="p-2 w-24">Status</th>
                <th className="p-2 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b">
                  <td className="p-2 font-mono">{i + 1}</td>
                  <td className="p-2">{it.titulo}</td>
                  <td className="p-2 truncate max-w-[200px]" title={it.clip || ''}>{it.clip}</td>
                  <td className="p-2 text-xs">{it.tipo}</td>
                  <td className={cn("p-2 text-xs", STATUS_COLOR[it.status])}>{STATUS_LABEL[it.status]}</td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => onTake(it)}>TAKE</Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePlaylistItem(it.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem itens. Adicione clipes às matérias para gerar a playlist.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
