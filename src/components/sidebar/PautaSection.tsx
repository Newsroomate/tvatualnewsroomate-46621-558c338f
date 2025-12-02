import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileText, Search, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Pauta } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import { generatePautaPDF } from "@/utils/pdf-utils";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    pendente: true,
    em_andamento: true,
    concluida: false
  });
  const { toast } = useToast();
  const { checkPermission, guardAction } = usePermissionGuard();

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

  const toggleGroup = (status: string) => {
    setExpandedGroups(prev => ({ ...prev, [status]: !prev[status] }));
  };

  // Filter and group pautas
  const groupedPautas = useMemo(() => {
    let filtered = pautas;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pauta =>
        pauta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pauta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pauta.local?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pauta.reporter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(pauta => pauta.status === statusFilter);
    }

    // Group by status
    const groups: Record<string, Pauta[]> = {
      pendente: [],
      em_andamento: [],
      concluida: []
    };

    filtered.forEach(pauta => {
      const status = pauta.status || 'pendente';
      if (groups[status]) {
        groups[status].push(pauta);
      }
    });

    return groups;
  }, [pautas, searchTerm, statusFilter]);

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pendente: 'Pendentes',
      em_andamento: 'Em Andamento',
      concluida: 'Concluídas'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      concluida: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const totalPautas = Object.values(groupedPautas).reduce((sum, group) => sum + group.length, 0);
  
  return (
    <div className="border-t border-border">
      {/* Header with Add Button */}
      <div className="p-3 bg-muted/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Pautas</h3>
            <Badge variant="secondary" className="text-xs">
              {totalPautas}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={onAddPauta}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">Adicionar Pauta</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar pautas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pautas List with ScrollArea */}
      {isLoading ? (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      ) : totalPautas === 0 ? (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            {searchTerm || statusFilter !== "all" 
              ? "Nenhuma pauta encontrada" 
              : "Nenhuma pauta disponível"}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-1">
            {Object.entries(groupedPautas).map(([status, pautasGroup]) => {
              if (pautasGroup.length === 0) return null;
              
              return (
                <Collapsible
                  key={status}
                  open={expandedGroups[status]}
                  onOpenChange={() => toggleGroup(status)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md transition-colors group">
                    <div className="flex items-center gap-2">
                      {expandedGroups[status] ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {getStatusLabel(status)}
                      </span>
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        {pautasGroup.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="ml-2 mt-1 space-y-1">
                      {pautasGroup.map((pauta) => (
                        <div
                          key={pauta.id}
                          className="group/item relative rounded-md hover:bg-accent/50 transition-colors"
                        >
                          <div className="p-2 pr-16">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {pauta.titulo}
                                </p>
                                {(pauta.local || pauta.reporter) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {pauta.local && (
                                      <span className="text-[10px] text-muted-foreground truncate">
                                        📍 {pauta.local}
                                      </span>
                                    )}
                                    {pauta.reporter && (
                                      <span className="text-[10px] text-muted-foreground truncate">
                                        👤 {pauta.reporter}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handlePrintPauta(pauta, e)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="sr-only">Imprimir PDF</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeletePauta(pauta, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      )}
      
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
