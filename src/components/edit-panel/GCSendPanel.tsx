import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Type, Send, ChevronDown, Check } from "lucide-react";
import { GCTemplate, GC_TEMPLATE_CATEGORIES } from "@/types/gc-templates";
import { fetchGCTemplates } from "@/services/gc-templates-api";
import { fetchVmixSettings, updateVmixText } from "@/services/vmix-api";
import { VmixSettings } from "@/types/vmix";
import { toast } from "sonner";

interface GCSendPanelProps {
  telejornalId?: string | null;
  onApplyTemplate: (gcText: string) => void;
  disabled?: boolean;
}

export const GCSendPanel = ({ telejornalId, onApplyTemplate, disabled }: GCSendPanelProps) => {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<GCTemplate[]>([]);
  const [vmixSettings, setVmixSettings] = useState<VmixSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [tmpl, vmix] = await Promise.all([
        fetchGCTemplates(telejornalId || undefined),
        telejornalId ? fetchVmixSettings(telejornalId) : Promise.resolve(null),
      ]);
      setTemplates(tmpl);
      setVmixSettings(vmix);
    } catch (e) {
      console.error("GCSendPanel load error:", e);
    } finally {
      setLoading(false);
    }
  }, [open, telejornalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = (template: GCTemplate) => {
    const gcText = template.campos.map((c) => c.valor).filter(Boolean).join("\n");
    onApplyTemplate(gcText);
    setAppliedId(template.id);
    setTimeout(() => setAppliedId(null), 2000);
    toast.success(`Template "${template.nome}" aplicado ao GC`);
  };

  const handleSendToVmix = async (e: React.MouseEvent, template: GCTemplate) => {
    e.stopPropagation();
    if (!vmixSettings) {
      toast.error("Configurações vMix não encontradas para este telejornal");
      return;
    }
    setSendingId(template.id);
    try {
      for (const campo of template.campos) {
        await updateVmixText(vmixSettings, campo.label, campo.valor);
      }
      toast.success(`GC "${template.nome}" enviado ao vMix`);
    } catch {
      toast.error("Erro ao enviar GC ao vMix");
    } finally {
      setSendingId(null);
    }
  };

  const getCatColor = (cat: string) => {
    const colors: Record<string, string> = {
      nome: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      local: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      credito: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      titulo: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      geral: "bg-muted text-muted-foreground",
    };
    return colors[cat] || colors.geral;
  };

  // Group templates by category
  const grouped = templates.reduce<Record<string, GCTemplate[]>>((acc, t) => {
    (acc[t.categoria] = acc[t.categoria] || []).push(t);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-7 px-2 text-xs gap-1"
        >
          <Type className="h-3 w-3" />
          Templates GC
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={4}
      >
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-semibold text-foreground">Biblioteca GC</p>
          <p className="text-[10px] text-muted-foreground">
            Clique para aplicar ao campo GC.{vmixSettings ? " Ícone ➔ envia ao vMix." : ""}
          </p>
        </div>

        <ScrollArea className="max-h-72">
          {loading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Carregando…</p>
          ) : templates.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Nenhum template GC criado ainda.
            </p>
          ) : (
            <div className="py-1">
              {Object.entries(grouped).map(([cat, items], gi) => (
                <div key={cat}>
                  {gi > 0 && <Separator className="my-1" />}
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {GC_TEMPLATE_CATEGORIES.find((c) => c.valor === cat)?.label || cat}
                  </p>
                  {items.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer group transition-colors"
                      onClick={() => handleApply(template)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {appliedId === template.id ? (
                            <Check className="h-3 w-3 text-primary shrink-0" />
                          ) : (
                            <Badge className={`text-[9px] px-1 py-0 h-4 shrink-0 ${getCatColor(cat)}`}>
                              GC
                            </Badge>
                          )}
                          <span className="text-xs font-medium truncate">{template.nome}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate pl-5">
                          {template.campos.map((c) => c.valor || "—").join(" · ")}
                        </p>
                      </div>

                      {vmixSettings && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={sendingId === template.id}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          title="Enviar ao vMix"
                          onClick={(e) => handleSendToVmix(e, template)}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
