import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap } from "lucide-react";
import { PlayoutTrigger, PlayoutTriggerExecuteAt, PlayoutTriggerType } from "@/types/playout";
import { createPlayoutTrigger, deletePlayoutTrigger, fetchPlayoutTriggers, updatePlayoutTrigger } from "@/services/playout-api";
import { toast } from "sonner";

interface PlayoutTriggerEditorProps {
  materiaId?: string;
}

const TRIGGER_TYPES: { value: PlayoutTriggerType; label: string }[] = [
  { value: 'vmix_command', label: 'Comando vMix' },
  { value: 'gpi_out', label: 'GPI Out' },
  { value: 'custom', label: 'Customizado (JSON)' },
];

const EXECUTE_AT: { value: PlayoutTriggerExecuteAt; label: string }[] = [
  { value: 'on_take', label: 'Ao TAKE' },
  { value: 'on_finish', label: 'Ao finalizar' },
  { value: 'after_delay', label: 'Após atraso' },
];

export const PlayoutTriggerEditor = ({ materiaId }: PlayoutTriggerEditorProps) => {
  const [items, setItems] = useState<PlayoutTrigger[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    if (!materiaId) return;
    try {
      const list = await fetchPlayoutTriggers(materiaId);
      setItems(list);
    } catch (e: any) {
      toast.error('Erro ao carregar triggers', { description: e?.message });
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaId]);

  const add = async () => {
    if (!materiaId) {
      toast.warning('Salve a matéria antes de adicionar triggers');
      return;
    }
    setLoading(true);
    try {
      await createPlayoutTrigger({
        materia_id: materiaId,
        trigger_type: 'vmix_command',
        trigger_data: { command: '' },
        execute_at: 'on_take',
        offset_ms: 0,
        ordem: items.length,
      });
      reload();
    } catch (e: any) {
      toast.error('Erro ao adicionar trigger', { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, patch: Partial<PlayoutTrigger>) => {
    try {
      await updatePlayoutTrigger(id, patch);
      setItems((prev) => prev.map((it) => (it.id === id ? ({ ...it, ...patch } as PlayoutTrigger) : it)));
    } catch (e: any) {
      toast.error('Erro ao atualizar trigger', { description: e?.message });
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePlayoutTrigger(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e: any) {
      toast.error('Erro ao remover trigger', { description: e?.message });
    }
  };

  if (!materiaId) return null;

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" /> Triggers de automação
        </Label>
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={loading}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Trigger
        </Button>
      </div>
      {items.length === 0 && (
        <div className="text-xs text-muted-foreground p-2 border border-dashed rounded">
          Nenhum trigger configurado. Triggers disparam comandos vMix, GPI ou JSON customizado.
        </div>
      )}
      {items.map((t) => (
        <div key={t.id} className="border rounded p-2 space-y-2">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs">Tipo</Label>
              <Select value={t.trigger_type} onValueChange={(v) => update(t.id, { trigger_type: v as PlayoutTriggerType })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((tt) => (
                    <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs">Quando</Label>
              <Select value={t.execute_at} onValueChange={(v) => update(t.id, { execute_at: v as PlayoutTriggerExecuteAt })}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXECUTE_AT.map((tt) => (
                    <SelectItem key={tt.value} value={tt.value}>{tt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {t.execute_at === 'after_delay' && (
              <div className="w-24">
                <Label className="text-xs">Atraso (ms)</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={t.offset_ms}
                  onChange={(e) => update(t.id, { offset_ms: parseInt(e.target.value || '0', 10) })}
                />
              </div>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => remove(t.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div>
            {t.trigger_type === 'vmix_command' && (
              <Input
                placeholder='Ex: Function=Cut&Input=2'
                value={t.trigger_data?.command || ''}
                onChange={(e) => update(t.id, { trigger_data: { ...t.trigger_data, command: e.target.value } })}
              />
            )}
            {t.trigger_type === 'gpi_out' && (
              <Input
                type="number"
                placeholder="Canal GPI"
                value={t.trigger_data?.channel || ''}
                onChange={(e) => update(t.id, { trigger_data: { ...t.trigger_data, channel: parseInt(e.target.value || '0', 10) } })}
              />
            )}
            {t.trigger_type === 'custom' && (
              <Input
                placeholder='{"foo":"bar"}'
                value={typeof t.trigger_data === 'string' ? t.trigger_data : JSON.stringify(t.trigger_data || {})}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value || '{}');
                    update(t.id, { trigger_data: parsed });
                  } catch {
                    // keep as raw text in local state
                    setItems((prev) => prev.map((it) => (it.id === t.id ? { ...it, trigger_data: e.target.value as any } : it)));
                  }
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
