import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, ShieldAlert, RotateCcw, History, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AuditEntry, FIELD_LABELS, canViewAudit, fetchAuditTimeline, restoreDeletedMateria,
  revertField, valueToText, wordDiff,
} from "@/services/audit-timeline-api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  telejornalId?: string;
  telejornalNome?: string;
  onRestored?: () => void;
}

const ACTION_LABEL: Record<string, string> = { create: "Criou", update: "Editou", delete: "Excluiu" };
const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  create: "default", update: "secondary", delete: "destructive",
};
const TEXT_FIELDS = new Set(["retranca", "cabeca", "texto", "gc", "gcs", "reporter", "clip", "editor", "local_gravacao"]);

export const AuditTimelineModal = ({ isOpen, onClose, telejornalId, telejornalNome, onRestored }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [day, setDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: allowed, isLoading: checking } = useQuery({
    queryKey: ["can-view-audit"], queryFn: canViewAudit, enabled: isOpen,
  });

  const range = useMemo(() => {
    const from = new Date(`${day}T00:00:00`);
    const to = new Date(from); to.setDate(to.getDate() + 1);
    return { from, to };
  }, [day]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit-timeline", telejornalId, day],
    queryFn: () => fetchAuditTimeline(telejornalId!, range),
    enabled: isOpen && !!telejornalId && !!allowed,
  });

  const users = useMemo(() => {
    const m = new Map<string, string>();
    entries.forEach((e) => m.set(e.user_id, e.user_name || "Usuário"));
    return [...m.entries()];
  }, [entries]);

  const filtered = entries.filter((e) =>
    (userFilter === "all" || e.user_id === userFilter) && (actionFilter === "all" || e.action === actionFilter));
  const deleted = entries.filter((e) => e.action === "delete");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["audit-timeline", telejornalId] });
    onRestored?.();
  };

  const handleRevert = async (entry: AuditEntry, field: string) => {
    setBusy(entry.id + field);
    try {
      await revertField(entry, field);
      toast({ title: "Versão anterior restaurada", description: `${FIELD_LABELS[field] || field} de "${entry.retranca}"` });
      refresh();
    } catch (e: any) {
      toast({ title: "Não foi possível restaurar", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const handleRestore = async (entry: AuditEntry) => {
    setBusy(entry.id);
    try {
      await restoreDeletedMateria(entry);
      toast({ title: "Matéria restaurada na grade", description: entry.retranca || "" });
      refresh();
    } catch (e: any) {
      toast({ title: "Não foi possível restaurar", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const describe = (e: AuditEntry) => {
    if (e.action === "update" && e.changed_fields?.length)
      return e.changed_fields.map((f) => FIELD_LABELS[f] || f).join(", ");
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Auditoria — {telejornalNome}</DialogTitle>
          <DialogDescription>Quem criou, editou ou excluiu matérias. Histórico detalhado guardado por 30 dias.</DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !allowed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <ShieldAlert className="h-10 w-10 text-destructive" />
            <p className="font-medium text-foreground">Acesso restrito</p>
            <p className="text-sm">A auditoria é exclusiva para Editores-Chefe e administradores.</p>
          </div>
        ) : (
          <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-wrap items-end gap-3">
              <TabsList>
                <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
                <TabsTrigger value="trash">Lixeira da edição ({deleted.length})</TabsTrigger>
              </TabsList>
              <div><Label className="text-xs">Dia</Label>
                <Input type="date" value={day} onChange={(e) => { setDay(e.target.value); setSelected(null); }} className="h-9 w-40" /></div>
              <div><Label className="text-xs">Usuário</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label className="text-xs">Ação</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="create">Criações</SelectItem>
                    <SelectItem value="update">Edições</SelectItem>
                    <SelectItem value="delete">Exclusões</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>

            <TabsContent value="timeline" className="flex-1 min-h-0 mt-3">
              <div className="grid grid-cols-5 gap-3 h-full min-h-0">
                <ScrollArea className="col-span-2 border rounded-md">
                  {isLoading ? <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    : filtered.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">Nenhuma atividade neste dia.</p>
                    : filtered.map((e) => (
                      <button key={e.id} onClick={() => setSelected(e)}
                        className={`w-full text-left px-3 py-2 border-b hover:bg-accent/50 ${selected?.id === e.id ? "bg-accent" : ""}`}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-muted-foreground">{format(new Date(e.created_at), "HH:mm:ss")}</span>
                          <Badge variant={ACTION_VARIANT[e.action] || "secondary"} className="text-[10px]">{ACTION_LABEL[e.action] || e.action}</Badge>
                          <span className="truncate">{e.user_name}</span>
                        </div>
                        <div className="text-sm font-medium truncate">{e.retranca || "(sem retranca)"}</div>
                        {describe(e) && <div className="text-xs text-muted-foreground truncate">{describe(e)}</div>}
                      </button>
                    ))}
                </ScrollArea>

                <ScrollArea className="col-span-3 border rounded-md p-4">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground text-center mt-10">Selecione uma atividade para ver o que mudou.</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="text-lg font-semibold">{selected.retranca}</div>
                        <div className="text-xs text-muted-foreground">
                          {ACTION_LABEL[selected.action]} por {selected.user_name} em{" "}
                          {format(new Date(selected.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </div>
                      </div>

                      {selected.action === "update" && !selected.diff && (
                        <p className="text-sm text-muted-foreground">Registro anterior à auditoria detalhada — sem detalhes do conteúdo.</p>
                      )}

                      {selected.action === "update" && selected.diff && Object.entries(selected.diff).map(([field, d]) => {
                        const oldT = valueToText(d.old), newT = valueToText(d.new);
                        return (
                          <div key={field} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{FIELD_LABELS[field] || field}</span>
                              {field !== "bloco_id" && field !== "ordem" && (
                                <Button size="sm" variant="outline" disabled={busy === selected.id + field}
                                  onClick={() => handleRevert(selected, field)}>
                                  <RotateCcw className="h-3 w-3 mr-1" /> Restaurar anterior
                                </Button>
                              )}
                            </div>
                            {TEXT_FIELDS.has(field) ? (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {wordDiff(oldT, newT).map((t, i) =>
                                  t.type === "same" ? <span key={i}>{t.text}</span>
                                  : t.type === "add" ? <span key={i} className="bg-primary/20 text-primary rounded-sm">{t.text}</span>
                                  : <span key={i} className="bg-destructive/20 text-destructive line-through rounded-sm">{t.text}</span>)}
                              </p>
                            ) : (
                              <p className="text-sm"><span className="text-destructive line-through">{oldT || "—"}</span> → <span className="text-primary">{newT || "—"}</span></p>
                            )}
                          </div>
                        );
                      })}

                      {selected.action === "delete" && selected.snapshot && (
                        <div className="space-y-3">
                          <SnapshotView snap={selected.snapshot} />
                          <Button disabled={!!selected.restored_at || busy === selected.id} onClick={() => handleRestore(selected)}>
                            <RotateCcw className="h-4 w-4 mr-1" /> {selected.restored_at ? "Já restaurada" : "Restaurar no bloco"}
                          </Button>
                        </div>
                      )}

                      {selected.action === "create" && <p className="text-sm text-muted-foreground">Matéria criada no espelho.</p>}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="trash" className="flex-1 min-h-0 mt-3">
              <ScrollArea className="h-full border rounded-md">
                {deleted.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">Nenhuma matéria excluída neste dia.</p>
                  : deleted.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b">
                      <Trash2 className="h-4 w-4 text-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{e.retranca}</div>
                        <div className="text-xs text-muted-foreground">
                          Excluída por {e.user_name} às {format(new Date(e.created_at), "HH:mm:ss")}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelected(e)}>Ver</Button>
                      <Button size="sm" disabled={!e.snapshot || !!e.restored_at || busy === e.id} onClick={() => handleRestore(e)}>
                        {e.restored_at ? "Restaurada" : "Restaurar no bloco"}
                      </Button>
                    </div>
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SnapshotView = ({ snap }: { snap: Record<string, any> }) => (
  <div className="border rounded-md p-3 space-y-2 text-sm">
    {["tipo_material", "reporter", "cabeca", "gc", "gcs", "texto", "clip", "tempo_clip"].map((f) => {
      const v = valueToText(snap[f]);
      if (!v || v === "[]") return null;
      return <div key={f}><span className="text-xs text-muted-foreground">{FIELD_LABELS[f]}</span>
        <p className="whitespace-pre-wrap">{v}</p></div>;
    })}
  </div>
);
