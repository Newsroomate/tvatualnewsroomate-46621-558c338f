import { useCallback, useEffect, useMemo, useState } from "react";
import { Pauta } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, Archive, Loader2 } from "lucide-react";
import { fetchPautasArquivadas, restorePauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PautasArquivadasProps {
  onRestored?: () => void;
  onViewPauta?: (pauta: Pauta) => void;
}

export const PautasArquivadas = ({ onRestored, onViewPauta }: PautasArquivadasProps) => {
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [pautaToRestore, setPautaToRestore] = useState<Pauta | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPautas(await fetchPautasArquivadas());
    } catch (err: any) {
      toast({ title: "Erro ao carregar arquivadas", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pautas;
    return pautas.filter((p) =>
      `${p.titulo} ${p.descricao || ""} ${p.reporter || ""} ${p.local || ""}`.toLowerCase().includes(q)
    );
  }, [pautas, search]);

  const handleRestore = async () => {
    if (!pautaToRestore) return;
    try {
      setRestoring(true);
      await restorePauta(pautaToRestore.id);
      toast({ title: "Pauta restaurada", description: pautaToRestore.titulo });
      await load();
      onRestored?.();
    } catch (err: any) {
      toast({ title: "Erro ao restaurar", description: err.message, variant: "destructive" });
    } finally {
      setRestoring(false);
      setPautaToRestore(null);
    }
  };

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border bg-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pauta arquivada..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">{filtered.length} arquivada{filtered.length !== 1 ? "s" : ""}</Badge>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Archive className="h-8 w-8" />
            <p className="text-sm">Nenhuma pauta arquivada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((pauta) => (
              <div
                key={pauta.id}
                className="p-4 rounded-lg border border-border bg-card/50 flex justify-between items-start gap-4"
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => onViewPauta?.(pauta)}
                >
                  <h3 className="font-semibold text-foreground">{pauta.titulo}</h3>
                  {pauta.descricao && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pauta.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Arquivada em {formatDate(pauta.deleted_at)}</span>
                    {pauta.reporter && <span>Repórter: {pauta.reporter}</span>}
                    {pauta.programa && <span>Programa: {pauta.programa}</span>}
                    {pauta.data_cobertura && <span>Cobertura: {pauta.data_cobertura}</span>}
                  </div>
                </button>
                <Button size="sm" variant="outline" onClick={() => setPautaToRestore(pauta)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!pautaToRestore} onOpenChange={(open) => !open && setPautaToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar pauta?</AlertDialogTitle>
            <AlertDialogDescription>
              A pauta <span className="font-medium text-foreground">"{pautaToRestore?.titulo}"</span> voltará
              para a lista de pautas ativas do Painel de Produção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring}>
              {restoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
