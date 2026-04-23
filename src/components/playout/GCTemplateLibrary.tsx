import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { Telejornal } from "@/types";
import { GC_TEMPLATE_CATEGORIES, GCTemplate, GCTemplateCampo, GCTemplateCategoria } from "@/types/gc-templates";
import { createGCTemplate, deleteGCTemplate, fetchGCTemplates, updateGCTemplate } from "@/services/gc-templates-api";
import { fetchVmixSettings, updateVmixText } from "@/services/vmix-api";
import { toast } from "sonner";

interface GCTemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
}

export const GCTemplateLibrary = ({ isOpen, onClose, currentTelejornal }: GCTemplateLibraryProps) => {
  const [list, setList] = useState<GCTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ nome: string; categoria: GCTemplateCategoria; campos: GCTemplateCampo[] } | null>(null);

  const reload = async () => {
    try {
      const d = await fetchGCTemplates(currentTelejornal?.id);
      setList(d);
    } catch (e: any) {
      toast.error('Erro ao carregar templates', { description: e?.message });
    }
  };

  useEffect(() => {
    if (isOpen) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentTelejornal?.id]);

  const newTemplate = () => {
    setEditingId('new');
    setDraft({ nome: 'Novo template', categoria: 'geral', campos: [{ label: 'Linha 1', valor: '' }, { label: 'Linha 2', valor: '' }] });
  };
  const editTemplate = (t: GCTemplate) => {
    setEditingId(t.id);
    setDraft({ nome: t.nome, categoria: t.categoria, campos: [...(t.campos || [])] });
  };
  const cancel = () => {
    setEditingId(null);
    setDraft(null);
  };
  const save = async () => {
    if (!draft) return;
    try {
      if (editingId === 'new') {
        await createGCTemplate({ ...draft, telejornal_id: currentTelejornal?.id ?? null });
      } else if (editingId) {
        await updateGCTemplate(editingId, draft as any);
      }
      cancel();
      reload();
      toast.success('Template salvo');
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e?.message });
    }
  };
  const remove = async (id: string) => {
    try { await deleteGCTemplate(id); reload(); toast.success('Removido'); }
    catch (e: any) { toast.error('Erro ao remover', { description: e?.message }); }
  };

  const sendToVmix = async (t: GCTemplate) => {
    if (!currentTelejornal) return;
    try {
      const settings: any = await fetchVmixSettings(currentTelejornal.id);
      if (!settings) { toast.warning('Configure o vMix primeiro'); return; }
      for (const c of t.campos || []) {
        await updateVmixText(settings, c.label, c.valor || '');
      }
      toast.success('Template enviado ao vMix');
    } catch (e: any) {
      toast.error('Erro ao enviar', { description: e?.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Biblioteca de GCs (templates)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {currentTelejornal ? `Telejornal: ${currentTelejornal.nome}` : 'Templates globais'}
            </div>
            <Button size="sm" onClick={newTemplate}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
          </div>

          {editingId && draft && (
            <div className="border rounded p-3 space-y-2 bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={draft.categoria} onValueChange={(v) => setDraft({ ...draft, categoria: v as GCTemplateCategoria })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GC_TEMPLATE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Campos</Label>
                {draft.campos.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Label (campo vMix)"
                      className="w-1/3"
                      value={c.label}
                      onChange={(e) => {
                        const arr = [...draft.campos]; arr[i] = { ...arr[i], label: e.target.value }; setDraft({ ...draft, campos: arr });
                      }}
                    />
                    <Input
                      placeholder="Valor"
                      value={c.valor}
                      onChange={(e) => {
                        const arr = [...draft.campos]; arr[i] = { ...arr[i], valor: e.target.value }; setDraft({ ...draft, campos: arr });
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, campos: draft.campos.filter((_, j) => j !== i) })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, campos: [...draft.campos, { label: '', valor: '' }] })}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar campo
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={cancel}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
                <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
              </div>
            </div>
          )}

          <div className="max-h-[50vh] overflow-auto space-y-2">
            {list.length === 0 && <div className="text-sm text-muted-foreground text-center p-3">Nenhum template criado.</div>}
            {list.map((t) => (
              <div key={t.id} className="border rounded p-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.nome}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {GC_TEMPLATE_CATEGORIES.find(c => c.value === t.categoria)?.label} · {(t.campos || []).length} campos
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => sendToVmix(t)}>Enviar vMix</Button>
                <Button size="sm" variant="ghost" onClick={() => editTemplate(t)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
