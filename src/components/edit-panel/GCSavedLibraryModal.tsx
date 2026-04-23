import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GC_TYPES, GC_TYPE_COLORS, GCType } from "@/types/gc";
import { GCSavedEntry, deleteGCSavedEntry, listGCSavedEntries, updateGCSavedEntry } from "@/services/gc-saved-entries-api";
import { toast } from "sonner";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GCSavedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick?: (entry: GCSavedEntry) => void;
}

export const GCSavedLibraryModal = ({ isOpen, onClose, onPick }: GCSavedLibraryModalProps) => {
  const [entries, setEntries] = useState<GCSavedEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ tipo: GCType; linha1: string; linha2: string } | null>(null);

  const reload = async () => {
    try {
      const list = await listGCSavedEntries();
      setEntries(list);
    } catch (e: any) {
      toast.error("Erro ao carregar biblioteca", { description: e?.message });
    }
  };

  useEffect(() => {
    if (isOpen) reload();
  }, [isOpen]);

  const filtered = entries.filter(
    (e) =>
      !filter.trim() ||
      e.linha1.toLowerCase().includes(filter.toLowerCase()) ||
      e.linha2.toLowerCase().includes(filter.toLowerCase())
  );

  const startEdit = (e: GCSavedEntry) => {
    setEditingId(e.id);
    setEditDraft({ tipo: e.tipo, linha1: e.linha1, linha2: e.linha2 });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };
  const saveEdit = async () => {
    if (!editingId || !editDraft) return;
    try {
      await updateGCSavedEntry(editingId, editDraft);
      toast.success("Atualizado");
      cancelEdit();
      reload();
    } catch (e: any) {
      toast.error("Erro ao atualizar", { description: e?.message });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteGCSavedEntry(id);
      toast.success("Removido da biblioteca");
      reload();
    } catch (e: any) {
      toast.error("Erro ao remover", { description: e?.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Biblioteca de GCs salvos</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Filtrar..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="max-h-[60vh] overflow-auto space-y-2">
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground text-center p-4">Nenhum GC salvo.</div>
            )}
            {filtered.map((e) => (
              <div key={e.id} className="border rounded-md p-2 flex items-center gap-2">
                <span className={cn("inline-block w-2 h-2 rounded-full", GC_TYPE_COLORS[e.tipo])} />
                {editingId === e.id && editDraft ? (
                  <>
                    <Select value={editDraft.tipo} onValueChange={(v) => setEditDraft({ ...editDraft, tipo: v as GCType })}>
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GC_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8"
                      value={editDraft.linha1}
                      onChange={(ev) => setEditDraft({ ...editDraft, linha1: ev.target.value })}
                    />
                    <Input
                      className="h-8"
                      value={editDraft.linha2}
                      onChange={(ev) => setEditDraft({ ...editDraft, linha2: ev.target.value })}
                    />
                    <Button size="sm" variant="ghost" onClick={saveEdit}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground w-24">{GC_TYPES.find((t) => t.value === e.tipo)?.label}</span>
                    <div className="flex-1 truncate">
                      <strong>{e.linha1}</strong>
                      {e.linha2 ? <span className="text-muted-foreground"> — {e.linha2}</span> : null}
                    </div>
                    <span className="text-xs text-muted-foreground">×{e.use_count}</span>
                    {onPick && (
                      <Button size="sm" variant="outline" onClick={() => onPick(e)}>
                        Usar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => startEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(e.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
