import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { KanbanSquare, CalendarDays, Users, Plus, RefreshCw } from "lucide-react";
import { Pauta } from "@/types";
import { fetchPautas, updatePauta, deletePauta } from "@/services/pautas-api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useProducaoPanelHeartbeat } from "@/hooks/useProducaoPanelStatus";
import { PautaIndependenteModal } from "@/components/PautaIndependenteModal";
import { PautasKanban } from "@/components/producao/PautasKanban";
import { PautasCalendar } from "@/components/producao/PautasCalendar";
import { AgendaContatos } from "@/components/producao/AgendaContatos";
import { toast } from "sonner";
import { format } from "date-fns";

const ProducaoPanelInner = () => {
  useProducaoPanelHeartbeat();
  const { user } = useAuth();
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("kanban");
  const [editingPauta, setEditingPauta] = useState<Pauta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pautaToDelete, setPautaToDelete] = useState<Pauta | null>(null);
  const [presetDate, setPresetDate] = useState<string | null>(null);

  // Suppress realtime toast for local mutations within 3s window
  const localMutations = useRef<Map<string, number>>(new Map());

  const trackLocal = useCallback((id: string) => {
    localMutations.current.set(id, Date.now());
  }, []);

  const isLocal = useCallback((id: string) => {
    const ts = localMutations.current.get(id);
    if (!ts) return false;
    if (Date.now() - ts > 3000) {
      localMutations.current.delete(id);
      return false;
    }
    return true;
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchPautas();
      setPautas(data);
    } catch (e) {
      console.error("[ProducaoPanel] erro carregar pautas:", e);
      toast.error("Erro ao carregar pautas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("pautas-producao-notify")
      .on("postgres_changes", { event: "*", schema: "public", table: "pautas" }, (payload) => {
        const id = (payload.new as any)?.id || (payload.old as any)?.id;
        const local = id && isLocal(id);
        load();
        if (local) return;
        if (payload.eventType === "INSERT") {
          toast.info(`Nova pauta: ${(payload.new as any)?.titulo ?? ""}`);
        } else if (payload.eventType === "UPDATE") {
          toast.info(`Pauta atualizada: ${(payload.new as any)?.titulo ?? ""}`);
        } else if (payload.eventType === "DELETE") {
          toast.warning("Uma pauta foi excluída");
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, isLocal]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") setTab("kanban");
      else if (e.key === "2") setTab("calendar");
      else if (e.key === "3") setTab("agenda");
      else if (e.key.toLowerCase() === "n") {
        setEditingPauta(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleEdit = (p: Pauta) => {
    setPresetDate(null);
    setEditingPauta(p);
    setIsModalOpen(true);
  };

  const handleDelete = (p: Pauta) => setPautaToDelete(p);

  const confirmDelete = async () => {
    if (!pautaToDelete) return;
    try {
      trackLocal(pautaToDelete.id);
      await deletePauta(pautaToDelete.id);
      setPautas((prev) => prev.filter((p) => p.id !== pautaToDelete.id));
      toast.success("Pauta excluída");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir pauta");
    } finally {
      setPautaToDelete(null);
    }
  };

  const handleStatusChange = async (p: Pauta, newStatus: string) => {
    try {
      trackLocal(p.id);
      setPautas((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: newStatus } : x)));
      await updatePauta(p.id, { status: newStatus });
      toast.success("Status atualizado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar status");
      load();
    }
  };

  const handleNewPautaForDate = (d: Date) => {
    setPresetDate(format(d, "yyyy-MM-dd"));
    setEditingPauta({ id: "", titulo: "", data_cobertura: format(d, "yyyy-MM-dd") } as Pauta);
    // pass via editing pauta with empty id will trigger "edit" mode with prefilled data;
    // simpler: open as new and let user pick date — but plan says preset should work.
    // We'll instead reuse new mode; preset injected via key trick
    setEditingPauta(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold">Painel de Produção</h1>
          <p className="text-xs text-muted-foreground">
            Gestão de pautas — {user?.email} · Atalhos: 1/2/3 abas, N nova pauta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPresetDate(null);
              setEditingPauta(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Pauta
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4 shrink-0">
          <TabsList className="h-11 bg-transparent">
            <TabsTrigger value="kanban" className="gap-2">
              <KanbanSquare className="h-4 w-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-2">
              <Users className="h-4 w-4" /> Agenda de Contatos
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden p-4 min-h-0">
          <TabsContent value="kanban" className="h-full mt-0 data-[state=inactive]:hidden" forceMount>
            <PautasKanban
              pautas={pautas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="calendar" className="h-full mt-0 data-[state=inactive]:hidden" forceMount>
            <PautasCalendar
              pautas={pautas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNewPautaForDate={handleNewPautaForDate}
            />
          </TabsContent>

          <TabsContent value="agenda" className="h-full mt-0 data-[state=inactive]:hidden" forceMount>
            <AgendaContatos pautas={pautas} onEditPauta={handleEdit} />
          </TabsContent>
        </div>
      </Tabs>

      <PautaIndependenteModal
        key={`${editingPauta?.id ?? "new"}-${presetDate ?? ""}`}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPauta(null);
          setPresetDate(null);
        }}
        onPautaCreated={() => {
          load();
        }}
        pauta={editingPauta && editingPauta.id ? editingPauta : null}
      />

      <AlertDialog open={!!pautaToDelete} onOpenChange={(o) => !o && setPautaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pauta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A pauta "{pautaToDelete?.titulo}" será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ProducaoPanel = () => (
  <ProtectedRoute>
    <ProducaoPanelInner />
  </ProtectedRoute>
);

export default ProducaoPanel;
