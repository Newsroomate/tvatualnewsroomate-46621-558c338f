import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { GcLayout, GcLayoutLine, GcMediaType, DEFAULT_GC_LAYOUT } from "@/types/gc-pacote-grafico";
import { GcBackgroundPreview } from "./GcBackgroundPreview";

interface GcLayoutEditorProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialLayout: GcLayout;
  mediaUrl: string | null;
  mediaType: GcMediaType;
  onSave: (layout: GcLayout) => Promise<void> | void;
  onLayoutChange?: (layout: GcLayout) => void;
}

const LineControls = ({
  label, value, onChange,
}: { label: string; value: GcLayoutLine; onChange: (v: GcLayoutLine) => void }) => {
  const set = <K extends keyof GcLayoutLine>(k: K, v: GcLayoutLine[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">X ({value.x}%)</Label>
          <Slider value={[value.x]} min={0} max={100} step={1} onValueChange={([v]) => set('x', v)} />
        </div>
        <div>
          <Label className="text-xs">Y ({value.y}%)</Label>
          <Slider value={[value.y]} min={0} max={100} step={1} onValueChange={([v]) => set('y', v)} />
        </div>
        <div>
          <Label className="text-xs">Tamanho ({value.fontSize}px)</Label>
          <Slider value={[value.fontSize]} min={10} max={120} step={1} onValueChange={([v]) => set('fontSize', v)} />
        </div>
        <div>
          <Label className="text-xs">Cor</Label>
          <Input type="color" value={value.color} onChange={(e) => set('color', e.target.value)} className="h-9 p-1" />
        </div>
        <div>
          <Label className="text-xs">Alinhamento</Label>
          <Select value={value.align} onValueChange={(v) => set('align', v as any)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Switch checked={value.bold} onCheckedChange={(b) => set('bold', b)} id={`bold-${label}`} />
          <Label htmlFor={`bold-${label}`} className="text-xs">Negrito</Label>
        </div>
      </div>
    </div>
  );
};

export const GcLayoutEditor = ({ open, onClose, title, initialLayout, mediaUrl, mediaType, onSave, onLayoutChange }: GcLayoutEditorProps) => {
  const [layout, setLayout] = useState<GcLayout>(initialLayout || DEFAULT_GC_LAYOUT);
  const [saving, setSaving] = useState(false);

  useEffect(() => { onLayoutChange?.(layout); }, [layout, onLayoutChange]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(layout);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar layout — {title}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <GcBackgroundPreview
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              layout={layout}
              linha1="NOME EXEMPLO"
              linha2={title}
            />
          </div>
          <div className="space-y-4">
            <LineControls label="Linha 1" value={layout.linha1} onChange={(v) => setLayout({ ...layout, linha1: v })} />
            <Separator />
            <LineControls label="Linha 2" value={layout.linha2} onChange={(v) => setLayout({ ...layout, linha2: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLayout(DEFAULT_GC_LAYOUT)} disabled={saving}>Restaurar padrão</Button>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar layout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
