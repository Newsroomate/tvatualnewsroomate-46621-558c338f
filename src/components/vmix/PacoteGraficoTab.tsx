import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Trash2, Sliders, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { GCType } from "@/types/gc";
import {
  GcPacoteGraficoEntry,
  GC_TIPO_LABELS,
  DEFAULT_GC_LAYOUT,
} from "@/types/gc-pacote-grafico";
import {
  fetchPacoteGrafico,
  upsertPacoteGraficoTipo,
  uploadGcBackground,
  removeGcBackground,
} from "@/services/gc-pacote-grafico-api";
import { GcBackgroundPreview } from "./GcBackgroundPreview";
import { GcLayoutEditor } from "./GcLayoutEditor";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

interface PacoteGraficoTabProps {
  telejornalId: string | null;
}

export const PacoteGraficoTab = ({ telejornalId }: PacoteGraficoTabProps) => {
  const { checkPermission } = usePermissionGuard();
  const [entries, setEntries] = useState<GcPacoteGraficoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTipo, setUploadingTipo] = useState<GCType | null>(null);
  const [editing, setEditing] = useState<GcPacoteGraficoEntry | null>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const canEdit = checkPermission('update', 'telejornal', undefined, false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchPacoteGrafico(telejornalId);
      setEntries(list);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar pacote gráfico', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [telejornalId]);

  const triggerUpload = (tipo: GCType) => {
    if (!canEdit) {
      toast({ title: 'Sem permissão', description: 'Você não tem permissão para editar este telejornal.', variant: 'destructive' });
      return;
    }
    inputsRef.current[tipo]?.click();
  };

  const handleFile = async (tipo: GCType, file: File | null) => {
    if (!file) return;
    setUploadingTipo(tipo);
    try {
      const { media_url, media_type } = await uploadGcBackground(telejornalId, tipo, file);
      const current = entries.find((e) => e.tipo === tipo);
      await upsertPacoteGraficoTipo(telejornalId, tipo, {
        media_url,
        media_type,
        layout: current?.layout ?? DEFAULT_GC_LAYOUT,
      });
      toast({ title: 'Fundo atualizado', description: GC_TIPO_LABELS[tipo] });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro no upload', description: e?.message, variant: 'destructive' });
    } finally {
      setUploadingTipo(null);
    }
  };

  const handleRemove = async (tipo: GCType) => {
    if (!canEdit) return;
    try {
      await removeGcBackground(telejornalId, tipo);
      toast({ title: 'Fundo removido' });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao remover', description: e?.message, variant: 'destructive' });
    }
  };

  const handleSaveLayout = async (tipo: GCType, layout: any) => {
    const current = entries.find((e) => e.tipo === tipo);
    try {
      await upsertPacoteGraficoTipo(telejornalId, tipo, {
        media_url: current?.media_url ?? null,
        media_type: current?.media_type ?? null,
        layout,
      });
      toast({ title: 'Layout salvo' });
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar layout', description: e?.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ImageIcon className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Pacote Gráfico — Fundos de GC</h3>
          <p className="text-xs text-muted-foreground">
            Faça upload de uma imagem ou vídeo de fundo para cada tipo de GC. Formatos recomendados: MP4, WebM ou imagem PNG/JPG.
            Arquivos .mov são aceitos mas podem não ter preview no navegador.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} title="Recarregar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {entries.map((entry) => {
          const isUploading = uploadingTipo === entry.tipo;
          const hasMedia = !!entry.media_url;
          return (
            <div key={entry.tipo} className="border border-border rounded-lg p-3 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{GC_TIPO_LABELS[entry.tipo]}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => triggerUpload(entry.tipo)}
                    disabled={!canEdit || isUploading}
                  >
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                    {hasMedia ? 'Trocar' : 'Upload'}
                  </Button>
                  {hasMedia && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => setEditing(entry)}
                        disabled={!canEdit}
                        title="Editar layout"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(entry.tipo)}
                        disabled={!canEdit}
                        title="Remover fundo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <input
                    ref={(el) => (inputsRef.current[entry.tipo] = el)}
                    type="file"
                    accept="image/*,video/mp4,video/webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      handleFile(entry.tipo, f);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
              <GcBackgroundPreview
                mediaUrl={entry.media_url}
                mediaType={entry.media_type}
                layout={entry.layout}
                linha1="NOME EXEMPLO"
                linha2={GC_TIPO_LABELS[entry.tipo]}
              />
            </div>
          );
        })}
      </div>

      {editing && (
        <GcLayoutEditor
          open={!!editing}
          onClose={() => setEditing(null)}
          title={GC_TIPO_LABELS[editing.tipo]}
          initialLayout={editing.layout}
          mediaUrl={editing.media_url}
          mediaType={editing.media_type}
          onLayoutChange={(layout) =>
            setEntries((prev) => prev.map((e) => (e.tipo === editing.tipo ? { ...e, layout } : e)))
          }
          onSave={(layout) => handleSaveLayout(editing.tipo, layout)}
        />
      )}
    </div>
  );
};
