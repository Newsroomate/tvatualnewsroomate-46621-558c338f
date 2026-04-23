import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Trash2,
  RotateCcw,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
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

// Mapeia chaves do snapshot para rótulos legíveis em português
const RELATED_TABLES: { key: string; label: string }[] = [
  { key: "blocos", label: "Blocos" },
  { key: "materias", label: "Matérias" },
  { key: "pautas_telejornal", label: "Vínculos de Pautas" },
  { key: "entrevistas_telejornal", label: "Vínculos de Entrevistas" },
  { key: "reportagens_telejornal", label: "Vínculos de Reportagens" },
  { key: "espelhos_salvos", label: "Espelhos Salvos" },
  { key: "vmix_settings", label: "Configurações vMix" },
  { key: "viewer_messages", label: "Mensagens de Telespectadores" },
  { key: "user_telejornal_access", label: "Acessos de Usuários" },
];

const countRelated = (snapshot: any) => {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const { key } of RELATED_TABLES) {
    const arr = snapshot?.[key];
    const n = Array.isArray(arr) ? arr.length : 0;
    counts[key] = n;
    total += n;
  }
  return { counts, total };
};

export const TrashModal = ({ isOpen, onClose, onRestored }: TrashModalProps) => {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TrashItem | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [actorMap, setActorMap] = useState<Record<string, string>>({});
  const [auditSearch, setAuditSearch] = useState("");
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      // Lazy cleanup of expired items
      await supabase.rpc("cleanup_expired_trash");

      // Carrega TODOS os itens (incluindo restaurados) para alimentar a auditoria
      const { data, error } = await supabase
        .from("deleted_items_trash")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      const list = (data ?? []) as TrashItem[];
      setItems(list);

      // Buscar nomes dos atores (deleted_by)
      const actorIds = Array.from(new Set(list.map((i) => i.deleted_by).filter(Boolean)));
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", actorIds);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => {
          map[p.id] = p.full_name ?? p.id;
        });
        setActorMap(map);
      }
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

  const activeItems = useMemo(() => items.filter((i) => !i.restored_at), [items]);

  const auditItems = useMemo(() => {
    const term = auditSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => {
      const actor = actorMap[i.deleted_by] ?? "";
      return (
        (i.entity_name ?? "").toLowerCase().includes(term) ||
        i.entity_type.toLowerCase().includes(term) ||
        actor.toLowerCase().includes(term)
      );
    });
  }, [items, auditSearch, actorMap]);

  const restoreTelejornal = async (item: TrashItem) => {
    const snap = item.snapshot ?? {};
    const tj = snap.telejornal;
    if (!tj?.id) {
      throw new Error("Snapshot inválido (telejornal não encontrado).");
    }

    const { error: tjErr } = await supabase.from("telejornais").insert({
      id: tj.id,
      nome: tj.nome,
      horario: tj.horario,
      espelho_aberto: tj.espelho_aberto ?? false,
      created_at: tj.created_at,
    });
    if (tjErr) throw tjErr;

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
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Lixeira & Auditoria de Exclusões
            </DialogTitle>
            <DialogDescription>
              Itens excluídos podem ser restaurados em até 7 dias. A aba Auditoria mostra todo o
              histórico, incluindo itens já restaurados.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="lixeira" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="lixeira" className="gap-2">
                <Inbox className="h-4 w-4" />
                Lixeira ({activeItems.length})
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Auditoria ({items.length})
              </TabsTrigger>
            </TabsList>

            {/* ABA LIXEIRA */}
            <TabsContent
              value="lixeira"
              className="flex-1 overflow-y-auto pr-1 mt-3 data-[state=inactive]:hidden"
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : activeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-muted-foreground">
                  <Inbox className="h-10 w-10" />
                  <p className="text-sm">A lixeira está vazia.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeItems.map((item) => {
                    const expiresIn = formatDistanceToNow(new Date(item.expires_at), {
                      locale: ptBR,
                      addSuffix: true,
                    });
                    const deletedAgo = formatDistanceToNow(new Date(item.deleted_at), {
                      locale: ptBR,
                      addSuffix: true,
                    });
                    const { total } = countRelated(item.snapshot);
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs uppercase">
                              {item.entity_type}
                            </Badge>
                            <span className="font-medium truncate">
                              {item.entity_name ?? "(sem nome)"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Excluído {deletedAgo} · expira {expiresIn} · {total} registro(s)
                            relacionado(s)
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
            </TabsContent>

            {/* ABA AUDITORIA */}
            <TabsContent
              value="auditoria"
              className="flex-1 overflow-y-auto pr-1 mt-3 data-[state=inactive]:hidden"
            >
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, tipo ou usuário..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                </div>
              ) : auditItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-muted-foreground">
                  <ClipboardList className="h-10 w-10" />
                  <p className="text-sm">Nenhum registro de auditoria encontrado.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {auditItems.map((item) => {
                    const { counts, total } = countRelated(item.snapshot);
                    const isExpanded = expandedAuditId === item.id;
                    const actorName = actorMap[item.deleted_by] ?? "Usuário desconhecido";
                    const deletedFmt = format(new Date(item.deleted_at), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    });
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-border bg-card overflow-hidden"
                      >
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={(open) => setExpandedAuditId(open ? item.id : null)}
                        >
                          <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs uppercase">
                                  {item.entity_type}
                                </Badge>
                                <span className="font-medium truncate">
                                  {item.entity_name ?? "(sem nome)"}
                                </span>
                                {item.restored_at ? (
                                  <Badge
                                    variant="outline"
                                    className="gap-1 text-green-600 dark:text-green-400 border-green-600/30"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Restaurado
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-destructive border-destructive/30"
                                  >
                                    Na lixeira
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {deletedFmt} · por <strong>{actorName}</strong> · {total}{" "}
                                registro(s) afetado(s)
                              </p>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/20">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                Registros Relacionados Afetados
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {RELATED_TABLES.map(({ key, label }) => (
                                  <div
                                    key={key}
                                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-background border border-border/50"
                                  >
                                    <span className="text-muted-foreground truncate">
                                      {label}
                                    </span>
                                    <Badge
                                      variant={counts[key] > 0 ? "secondary" : "outline"}
                                      className="ml-2 shrink-0"
                                    >
                                      {counts[key]}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                              {item.restored_at && (
                                <p className="text-xs text-muted-foreground mt-3">
                                  Restaurado em{" "}
                                  {format(new Date(item.restored_at), "dd/MM/yyyy HH:mm", {
                                    locale: ptBR,
                                  })}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                ID da entidade:{" "}
                                <code className="text-[10px]">{item.entity_id}</code>
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          </Tabs>
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
