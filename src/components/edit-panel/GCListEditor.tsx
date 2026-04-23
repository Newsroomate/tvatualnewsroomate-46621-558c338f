import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GCEntry, GCType, GC_TYPES, GC_TYPE_COLORS, newGCEntry } from "@/types/gc";
import { Materia } from "@/types";
import { Bookmark, GripVertical, Plus, Send, Trash2, Library, ChevronUp, ChevronDown, Camera, User, Mic, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchGCSavedEntries, upsertGCSavedEntry, GCSavedEntry } from "@/services/gc-saved-entries-api";
import { fetchVmixSettings, updateVmixText } from "@/services/vmix-api";
import { toast } from "sonner";

interface GCListEditorProps {
  formData: Partial<Materia>;
  gcs: GCEntry[];
  onChange: (gcs: GCEntry[]) => void;
  disabled?: boolean;
  telejornalId?: string | null;
  onOpenLibrary?: () => void;
}

const LINHA_FINA_OK_MIN = 20;
const LINHA_FINA_OK_MAX = 42;

export const GCListEditor = ({ formData, gcs, onChange, disabled, telejornalId, onOpenLibrary }: GCListEditorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoRemoveSec, setAutoRemoveSec] = useState<number>(0);
  const [suggestionsFor, setSuggestionsFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GCSavedEntry[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const update = useCallback(
    (next: GCEntry[]) => {
      onChange(next);
    },
    [onChange]
  );

  const setEntry = (idx: number, patch: Partial<GCEntry>) => {
    const next = gcs.map((g, i) => (i === idx ? { ...g, ...patch } : g));
    update(next);
  };

  const removeEntry = (idx: number) => {
    update(gcs.filter((_, i) => i !== idx));
    if (activeIndex >= gcs.length - 1) setActiveIndex(Math.max(0, gcs.length - 2));
  };

  const addEntry = (tipo: GCType = 'geral', linha1 = '', linha2 = '') => {
    update([...gcs, newGCEntry(tipo, linha1, linha2)]);
    setActiveIndex(gcs.length);
  };

  // Auto-fill from materia fields
  const addReporter = () => {
    if (formData.reporter) addEntry('reporter', formData.reporter, formData.local_gravacao || '');
    else toast.warning('Preencha o campo Repórter na matéria');
  };
  const addCinegrafista = () => {
    if (formData.equipamento) addEntry('cinegrafista', formData.equipamento, '');
    else toast.warning('Preencha o campo Equipamento na matéria');
  };
  const addProdutor = () => {
    if (formData.editor) addEntry('produtor', formData.editor, '');
    else toast.warning('Preencha o campo Editor/Produtor na matéria');
  };

  // Autocomplete
  useEffect(() => {
    if (!suggestionsFor) {
      setSuggestions([]);
      return;
    }
    const entry = gcs.find((g) => g.id === suggestionsFor);
    if (!entry || (entry.linha1 || '').trim().length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await searchGCSavedEntries(entry.linha1.trim(), 8);
      setSuggestions(res);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [suggestionsFor, gcs]);

  const applySuggestion = (entryId: string, s: GCSavedEntry) => {
    const idx = gcs.findIndex((g) => g.id === entryId);
    if (idx < 0) return;
    setEntry(idx, { tipo: s.tipo, linha1: s.linha1, linha2: s.linha2 });
    setSuggestionsFor(null);
  };

  const saveToLibrary = async (entry: GCEntry) => {
    if (!entry.linha1.trim()) {
      toast.warning('Preencha pelo menos a Linha 1');
      return;
    }
    try {
      await upsertGCSavedEntry(entry.tipo, entry.linha1, entry.linha2);
      toast.success('GC salvo na biblioteca');
    } catch (e: any) {
      toast.error('Erro ao salvar GC', { description: e?.message });
    }
  };

  const sendToVmix = async (entry: GCEntry) => {
    if (!telejornalId) {
      toast.warning('Telejornal não definido');
      return;
    }
    try {
      const settings: any = await fetchVmixSettings(telejornalId);
      if (!settings) {
        toast.warning('Configure o vMix nas configurações do telejornal');
        return;
      }
      const mappings = settings.gc_field_mappings || {};
      const map = mappings[entry.tipo];
      if (!map) {
        toast.warning(`Sem mapeamento vMix para o tipo "${entry.tipo}"`);
        return;
      }
      const baseSettings = { ...settings, title_input_name: map.input };
      await updateVmixText(baseSettings, map.line1Field, entry.linha1);
      if (map.line2Field) {
        await updateVmixText(baseSettings, map.line2Field, entry.linha2 || '');
      }
      toast.success('GC enviado ao vMix');

      if (autoRemoveSec > 0) {
        setTimeout(async () => {
          try {
            await updateVmixText(baseSettings, map.line1Field, '');
            if (map.line2Field) await updateVmixText(baseSettings, map.line2Field, '');
          } catch {}
        }, autoRemoveSec * 1000);
      }
    } catch (e: any) {
      toast.error('Erro ao enviar GC', { description: e?.message });
    }
  };

  const sendAll = async () => {
    for (let i = 0; i < gcs.length; i++) {
      await sendToVmix(gcs[i]);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  // Keyboard shortcuts F2/F3/F4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'F2') {
        e.preventDefault();
        if (gcs[activeIndex]) {
          sendToVmix(gcs[activeIndex]);
          setActiveIndex(Math.min(gcs.length - 1, activeIndex + 1));
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveIndex(Math.min(gcs.length - 1, activeIndex + 1));
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveIndex(Math.max(0, activeIndex - 1));
      }
      if (inField) return;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gcs, activeIndex, disabled]);

  // Drag and drop reordering (HTML5 native)
  const onDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (idx: number) => {
    const from = dragIndexRef.current;
    if (from === null || from === idx) return;
    const arr = [...gcs];
    const [moved] = arr.splice(from, 1);
    arr.splice(idx, 0, moved);
    update(arr);
    dragIndexRef.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-medium">GCs (Geradores de Caracteres)</Label>
        <div className="flex flex-wrap gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => addEntry('geral')} disabled={disabled}>
            <Plus className="h-3.5 w-3.5 mr-1" /> GC
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={addReporter} disabled={disabled}>
            <Mic className="h-3.5 w-3.5 mr-1" /> Repórter
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={addCinegrafista} disabled={disabled}>
            <Camera className="h-3.5 w-3.5 mr-1" /> Cinegrafista
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={addProdutor} disabled={disabled}>
            <User className="h-3.5 w-3.5 mr-1" /> Produtor
          </Button>
          {onOpenLibrary && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenLibrary}>
              <Library className="h-3.5 w-3.5 mr-1" /> Biblioteca
            </Button>
          )}
        </div>
      </div>

      {gcs.length === 0 && (
        <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-md text-center">
          Nenhum GC adicionado. Use os botões acima para criar GCs estruturados.
        </div>
      )}

      <div className="space-y-2">
        {gcs.map((g, idx) => {
          const isActive = idx === activeIndex;
          const linhaFinaLen = g.tipo === 'linha_fina' ? (g.linha1 + ' ' + g.linha2).trim().length : 0;
          const linhaFinaColor =
            g.tipo === 'linha_fina'
              ? linhaFinaLen >= LINHA_FINA_OK_MIN && linhaFinaLen <= LINHA_FINA_OK_MAX
                ? 'text-emerald-600'
                : 'text-amber-600'
              : '';
          return (
            <div
              key={g.id}
              draggable={!disabled}
              onDragStart={() => onDragStart(idx)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(idx)}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "border rounded-md p-2 bg-background transition-colors",
                isActive ? "border-primary ring-1 ring-primary/30" : "border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className={cn("inline-block w-2 h-2 rounded-full", GC_TYPE_COLORS[g.tipo])} />
                <Select
                  value={g.tipo}
                  onValueChange={(v) => setEntry(idx, { tipo: v as GCType })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 w-40">
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
                <div className="flex-1" />
                <Button type="button" size="sm" variant="ghost" onClick={() => sendToVmix(g)} title="Enviar ao vMix" disabled={disabled}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => saveToLibrary(g)} title="Salvar na biblioteca" disabled={disabled}>
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (idx > 0) {
                      const arr = [...gcs];
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      update(arr);
                      setActiveIndex(idx - 1);
                    }
                  }}
                  disabled={disabled || idx === 0}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (idx < gcs.length - 1) {
                      const arr = [...gcs];
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      update(arr);
                      setActiveIndex(idx + 1);
                    }
                  }}
                  disabled={disabled || idx === gcs.length - 1}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeEntry(idx)} disabled={disabled}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid gap-2 relative">
                <Input
                  placeholder="Linha 1"
                  value={g.linha1}
                  onChange={(e) => setEntry(idx, { linha1: e.target.value })}
                  onFocus={() => setSuggestionsFor(g.id)}
                  onBlur={() => setTimeout(() => setSuggestionsFor((cur) => (cur === g.id ? null : cur)), 150)}
                  disabled={disabled}
                />
                {suggestionsFor === g.id && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-2 py-1.5 hover:bg-accent text-sm flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applySuggestion(g.id, s);
                        }}
                      >
                        <span className={cn("inline-block w-2 h-2 rounded-full", GC_TYPE_COLORS[s.tipo])} />
                        <span className="flex-1 truncate">
                          <strong>{s.linha1}</strong>
                          {s.linha2 ? <span className="text-muted-foreground"> — {s.linha2}</span> : null}
                        </span>
                        <ListChecks className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="Linha 2"
                  value={g.linha2}
                  onChange={(e) => setEntry(idx, { linha2: e.target.value })}
                  disabled={disabled}
                />
                {g.tipo === 'linha_fina' && (
                  <div className={cn("text-xs", linhaFinaColor)}>
                    {linhaFinaLen} caracteres (ideal: {LINHA_FINA_OK_MIN}–{LINHA_FINA_OK_MAX})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {gcs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Label className="text-xs">Auto-remover:</Label>
            <Select value={String(autoRemoveSec)} onValueChange={(v) => setAutoRemoveSec(parseInt(v, 10))}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Desligado</SelectItem>
                {[3, 5, 7, 10, 15, 20, 30].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={sendAll} disabled={disabled}>
            <Send className="h-3.5 w-3.5 mr-1" /> Enviar todos ao vMix
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Atalhos: <kbd className="px-1 border rounded">F2</kbd> enviar e avançar ·{" "}
        <kbd className="px-1 border rounded">F3</kbd> avançar ·{" "}
        <kbd className="px-1 border rounded">F4</kbd> voltar
      </div>
    </div>
  );
};
