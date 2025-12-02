import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileText, Search, Filter, ChevronDown, ChevronRight, Edit2 } from "lucide-react";
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
  onEditPauta: (pauta: Pauta) => void;
  isLoading: boolean;
  onDataChange: () => void;
}

export const PautaSection = ({
  pautas,
  onAddPauta,
  onEditPauta,
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

  const handleEditPauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkPermission('update', 'pauta', pauta.user_id || undefined)) return;
    onEditPauta(pauta);
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
    <div className="border-t border-border/50 bg-gradient-to-b from-background to-muted/20">
      {/* Header with Add Button */}
      <div className="p-4 space-y-4">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Pautas</h3>
              <Badge 
                variant="secondary" 
                className="text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm"
              >
                {totalPautas}
              </Badge>
            </div>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-3 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105" 
            onClick={onAddPauta}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs font-medium">Nova</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Buscar por título, local, repórter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 pr-4 text-xs bg-background/50 backdrop-blur-sm border-border/50 rounded-lg shadow-sm focus:shadow-md transition-all duration-200 focus:border-primary/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/30">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            <span className="text-[11px] font-medium text-muted-foreground">Filtro:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs flex-1 border-border/50 bg-background/50 shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-md border-border/50 shadow-lg">
              <SelectItem value="all" className="text-xs">Todos os status</SelectItem>
              <SelectItem value="pendente" className="text-xs">Pendentes</SelectItem>
              <SelectItem value="em_andamento" className="text-xs">Em Andamento</SelectItem>
              <SelectItem value="concluida" className="text-xs">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pautas List with ScrollArea */}
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Carregando pautas...</p>
          </div>
        ) : totalPautas === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                {searchTerm || statusFilter !== "all" ? "Nenhuma pauta encontrada" : "Nenhuma pauta"}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Tente ajustar os filtros" 
                  : "Crie sua primeira pauta"}
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[420px] pr-1">
            <div className="space-y-3 py-1">
              {Object.entries(groupedPautas).map(([status, pautasGroup]) => {
                if (pautasGroup.length === 0) return null;
                
                return (
                  <Collapsible
                    key={status}
                    open={expandedGroups[status]}
                    onOpenChange={() => toggleGroup(status)}
                    className="space-y-2"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-accent/50 rounded-lg transition-all duration-200 group border border-transparent hover:border-border/50 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="transition-transform duration-200 group-hover:scale-110">
                          {expandedGroups[status] ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                          {getStatusLabel(status)}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm ${getStatusColor(status)}`}
                        >
                          {pautasGroup.length}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="animate-accordion-down">
                      <div className="ml-3 space-y-2 pt-1">
                        {pautasGroup.map((pauta, index) => (
                          <div
                            key={pauta.id}
                            className="group/item relative rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 overflow-hidden animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative p-3 pr-20">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-foreground leading-relaxed line-clamp-2 group-hover/item:text-primary transition-colors duration-200">
                                  {pauta.titulo}
                                </p>
                                
                                {(pauta.local || pauta.reporter || pauta.data_cobertura) && (
                                  <div className="flex flex-wrap gap-2">
                                    {pauta.local && (
                                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/30">
                                        <span className="text-[10px]">📍</span>
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                          {pauta.local}
                                        </span>
                                      </div>
                                    )}
                                    {pauta.reporter && (
                                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/30">
                                        <span className="text-[10px]">👤</span>
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                          {pauta.reporter}
                                        </span>
                                      </div>
                                    )}
                                    {pauta.data_cobertura && (
                                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/30">
                                        <span className="text-[10px]">📅</span>
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                          {pauta.data_cobertura}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-all duration-200 translate-x-2 group-hover/item:translate-x-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-blue-50 hover:border-blue-200 hover:scale-110 transition-all duration-200 shadow-sm text-blue-600 dark:hover:bg-blue-950 dark:text-blue-400"
                                onClick={(e) => handleEditPauta(pauta, e)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Editar Pauta</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-primary/10 hover:border-primary/50 hover:scale-110 transition-all duration-200 shadow-sm"
                                onClick={(e) => handlePrintPauta(pauta, e)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="sr-only">Imprimir PDF</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-destructive/10 hover:border-destructive/50 hover:scale-110 transition-all duration-200 shadow-sm text-destructive"
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
