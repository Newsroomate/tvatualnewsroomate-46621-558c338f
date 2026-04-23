import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Trash2, RotateCcw, Loader2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrashItem {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  snapshot: any;
  deleted_by: string;
  deleted_at: string;
  expires_at: string;
  restored_at: string | null;
}

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

export const TrashModal = ({ isOpen, onClose, onRestored }: TrashModalProps) => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TrashItem | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const { toast } = useToast();

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      // Lazy cleanup of expired items
      await supabase.rpc("cleanup_expired_trash");

      const { data, error } = await supabase
        .from("deleted_items_trash")
        .select("*")
        .is("restored_at", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      setItems((data ?? []) as TrashItem[]);
    } catch (err: any) {
      console.error("Erro ao carregar lixeira:", err);
      toast({
        title: "Erro ao carregar lixeira",
        description: err?.message ?? "Não foi possível carregar os itens excluídos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      loadTrash();
    }
  }, [isOpen, loadTrash]);

  const restoreTelejornal = async (item: TrashItem) => {
    const snap = item.snapshot ?? {};
    const tj = snap.telejornal;
    if (!tj?.id) {
      throw new Error("Snapshot inválido (telejornal não encontrado).");
    }

    // Re-inserir telejornal preservando o id original
    const { error: tjErr } = await supabase.from("telejornais").insert({
      id: tj.id,
      nome: tj.nome,
      horario: tj.horario,
      espelho_aberto: tj.espelho_aberto ?? false,
      created_at: tj.created_at,
    });
    if (tjErr) throw tjErr;

    // Blocos
    const blocos = (snap.blocos ?? []) as any[];
    if (blocos.length > 0) {
      const { error } = await supabase.from("blocos").insert(
        blocos.map((b) => ({
          id: b.id,
          nome: b.nome,
          ordem: b.ordem,
          telejornal_id: b.telejornal_id,
          created_at: b.created_at,
        }))
      );
      if (error) throw error;
    }

    // Matérias
    const materias = (snap.materias ?? []) as any[];
    if (materias.length > 0) {
      const { error } = await supabase.from("materias").insert(
        materias.map((m) => ({
          id: m.id,
          bloco_id: m.bloco_id,
          retranca: m.retranca,
          ordem: m.ordem,
          duracao: m.duracao,
          status: m.status,
          texto: m.texto,
          cabeca: m.cabeca,
          gc: m.gc,
          editor: m.editor,
          reporter: m.reporter,
          equipamento: m.equipamento,
          tags: m.tags,
          local_gravacao: m.local_gravacao,
          tipo_material: m.tipo_material,
          clip: m.clip,
          tempo_clip: m.tempo_clip,
          pagina: m.pagina,
          horario_exibicao: m.horario_exibicao,
          is_from_snapshot: m.is_from_snapshot,
          created_at: m.created_at,
        }))
      );
      if (error) throw error;
    }

    // Tabelas de vínculo / extras
    const insertIfAny = async (table: string, rows: any[] | undefined) => {
      if (!rows || rows.length === 0) return;
      const { error } = await supabase.from(table as any).insert(rows as any);
      if (error) throw error;
    };

    await insertIfAny("pautas_telejornal", snap.pautas_telejornal);
    await insertIfAny("entrevistas_telejornal", snap.entrevistas_telejornal);
    await insertIfAny("reportagens_telejornal", snap.reportagens_telejornal);
    await insertIfAny("espelhos_salvos", snap.espelhos_salvos);
    await insertIfAny("vmix_settings", snap.vmix_settings);
    await insertIfAny("viewer_messages", snap.viewer_messages);
    await insertIfAny("user_telejornal_access", snap.user_telejornal_access);
  };

  const handleRestore = async (item: TrashItem) => {
    setRestoringId(item.id);
    try {
      if (item.entity_type === "telejornal") {
        await restoreTelejornal(item);
      } else {
        throw new Error(`Restauração de "${item.entity_type}" ainda não suportada.`);
      }

      // Marcar como restaurado
      const { error } = await supabase
        .from("deleted_items_trash")
        .update({ restored_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;

      toast({
        title: "Restaurado com sucesso",
        description: `"${item.entity_name ?? "Item"}" foi restaurado.`,
      });
      await loadTrash();
      onRestored?.();
    } catch (err: any) {
      console.error("Erro ao restaurar:", err);
      toast({
        title: "Erro ao restaurar",
        description: err?.message ?? "Não foi possível restaurar este item.",
        variant: "destructive",
      });
    } finally {
      setRestoringId(null);
    }
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    setIsPurging(true);
    try {
      const { error } = await supabase
        .from("deleted_items_trash")
        .delete()
        .eq("id", purgeTarget.id);
      if (error) throw error;
      toast({
        title: "Item excluído permanentemente",
        description: `"${purgeTarget.entity_name ?? "Item"}" foi removido da lixeira.`,
      });
      setPurgeTarget(null);
      await loadTrash();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message ?? "Não foi possível excluir definitivamente.",
        variant: "destructive",
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Lixeira
            </DialogTitle>
            <DialogDescription>
              Itens excluídos podem ser restaurados em até 7 dias. Após esse prazo, são removidos
              automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Carregando lixeira...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-muted-foreground">
                <Inbox className="h-10 w-10" />
                <p className="text-sm">A lixeira está vazia.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => {
                  const expiresIn = formatDistanceToNow(new Date(item.expires_at), {
                    locale: ptBR,
                    addSuffix: true,
                  });
                  const deletedAgo = formatDistanceToNow(new Date(item.deleted_at), {
                    locale: ptBR,
                    addSuffix: true,
                  });
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            {item.entity_type}
                          </span>
                          <span className="font-medium truncate">
                            {item.entity_name ?? "(sem nome)"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Excluído {deletedAgo} · expira {expiresIn}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id}
                        className="gap-1.5"
                      >
                        {restoringId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Restaurar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPurgeTarget(item)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Excluir permanentemente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!purgeTarget} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. <strong>{purgeTarget?.entity_name}</strong> será
              removido da lixeira para sempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPurging}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handlePurge();
              }}
              disabled={isPurging}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPurging ? "Excluindo..." : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
