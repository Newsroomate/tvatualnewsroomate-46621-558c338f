
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileText, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Pauta } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { deletePauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import { generatePautaPDF } from "@/utils/pdf-utils";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

interface PautaSectionProps {
  pautas: Pauta[];
  onAddPauta: () => void;
  isLoading: boolean;
  onDataChange: () => void;
}

export const PautaSection = ({
  pautas,
  onAddPauta,
  isLoading,
  onDataChange
}: PautaSectionProps) => {
  const [deletingPauta, setDeletingPauta] = useState<Pauta | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    pendente: true,
    em_andamento: true,
    concluida: false
  });
  
  const { toast } = useToast();
  const { checkPermission, guardAction } = usePermissionGuard();

  // Agrupar e filtrar pautas
  const groupedPautas = useMemo(() => {
    let filtered = pautas;
    
    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reporter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por status
    if (filterStatus !== "all") {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Agrupar por status
    const groups: Record<string, Pauta[]> = {
      pendente: [],
      em_andamento: [],
      concluida: []
    };
    
    filtered.forEach(pauta => {
      const status = pauta.status || 'pendente';
      if (groups[status]) {
        groups[status].push(pauta);
      } else {
        groups.pendente.push(pauta);
      }
    });
    
    return groups;
  }, [pautas, searchTerm, filterStatus]);

  const toggleGroup = (status: string) => {
    setOpenGroups(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" }> = {
    pendente: { label: "Pendente", variant: "default" },
    em_andamento: { label: "Em Andamento", variant: "secondary" },
    concluida: { label: "Concluída", variant: "success" }
  };

  const handleDeletePauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkPermission('delete', 'pauta', pauta.user_id || undefined)) return;
    setDeletingPauta(pauta);
  };

  const handlePrintPauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      generatePautaPDF(pauta);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const confirmDeletePauta = async () => {
    if (!deletingPauta) return;
    
    await guardAction('delete', 'pauta', async () => {
      await deletePauta(deletingPauta.id);
      onDataChange();
      toast({
        title: "Pauta excluída",
        description: "A pauta foi excluída com sucesso.",
      });
    }, deletingPauta.user_id || undefined);
    
    setDeletingPauta(null);
  };
  
  return (
    <div className="flex flex-col h-full border-t">
      {/* Header fixo */}
      <div className="flex-shrink-0 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">PAUTAS</h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onAddPauta}>
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Adicionar Pauta</span>
          </Button>
        </div>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar pautas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        
        {/* Filtros de status */}
        <div className="flex gap-1">
          <Button
            variant={filterStatus === "all" ? "default" : "ghost"}
            size="sm"
            className="h-6 text-xs flex-1"
            onClick={() => setFilterStatus("all")}
          >
            Todas
          </Button>
          <Button
            variant={filterStatus === "pendente" ? "default" : "ghost"}
            size="sm"
            className="h-6 text-xs flex-1"
            onClick={() => setFilterStatus("pendente")}
          >
            Pendentes
          </Button>
          <Button
            variant={filterStatus === "em_andamento" ? "default" : "ghost"}
            size="sm"
            className="h-6 text-xs flex-1"
            onClick={() => setFilterStatus("em_andamento")}
          >
            Em And.
          </Button>
        </div>
      </div>

      {/* Lista com scroll */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedPautas).map(([status, pautasInGroup]) => {
              if (pautasInGroup.length === 0) return null;
              
              return (
                <Collapsible
                  key={status}
                  open={openGroups[status]}
                  onOpenChange={() => toggleGroup(status)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 px-2 rounded hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {openGroups[status] ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium">{statusLabels[status].label}</span>
                      <Badge variant={statusLabels[status].variant as any} className="h-4 px-1.5 text-[10px]">
                        {pautasInGroup.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-1 mt-1">
                    {pautasInGroup.map(pauta => (
                      <div
                        key={pauta.id}
                        className="group relative pl-6 pr-2 py-2 rounded border border-border/50 hover:border-border hover:bg-accent/30 transition-all"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium line-clamp-2 pr-14">{pauta.titulo}</p>
                          {pauta.reporter && (
                            <p className="text-[10px] text-muted-foreground">👤 {pauta.reporter}</p>
                          )}
                          {pauta.data_cobertura && (
                            <p className="text-[10px] text-muted-foreground">📅 {pauta.data_cobertura}</p>
                          )}
                        </div>
                        
                        <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => handlePrintPauta(pauta, e)}
                          >
                            <FileText className="h-3 w-3" />
                            <span className="sr-only">PDF</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => handleDeletePauta(pauta, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            
            {pautas.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Nenhuma pauta disponível
              </p>
            )}
            
            {pautas.length > 0 && Object.values(groupedPautas).every(g => g.length === 0) && (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Nenhuma pauta encontrada
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Delete Pauta Confirmation */}
      <AlertDialog open={!!deletingPauta} onOpenChange={() => setDeletingPauta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pauta?
              <br />
              <strong className="text-destructive">{deletingPauta?.titulo}</strong>
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePauta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
