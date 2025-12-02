import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileText, Search, Filter, ChevronDown, ChevronRight, Edit2, MapPin, User, Calendar } from "lucide-react";
import { Pauta } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePauta, updatePauta } from "@/services/pautas-api";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const handleStatusChange = async (pauta: Pauta, newStatus: string) => {
    console.log('[PautaSection] Alterando status da pauta:', pauta.id, 'para:', newStatus);
    console.log('[PautaSection] Pauta user_id:', pauta.user_id);
    
    try {
      await guardAction('update', 'pauta', async () => {
        console.log('[PautaSection] Chamando updatePauta...');
        const result = await updatePauta(pauta.id, { status: newStatus });
        console.log('[PautaSection] Resultado da atualização:', result);
        
        await onDataChange();
        console.log('[PautaSection] Dados recarregados');
        
        toast({
          title: "Status atualizado",
          description: `Status alterado para ${getStatusLabel(newStatus)}`,
        });
      }, pauta.user_id || undefined);
    } catch (error) {
      console.error('[PautaSection] Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da pauta. Verifique suas permissões.",
        variant: "destructive"
      });
    }
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
      pendente: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      em_andamento: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      concluida: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const totalPautas = Object.values(groupedPautas).reduce((sum, group) => sum + group.length, 0);
  
  return (
    <div className="border-t border-border/50">
      {/* Header with Add Button */}
      <div className="p-4 space-y-3">
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
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            <span className="text-[11px] font-medium text-muted-foreground">Filtro:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs flex-1 border-border/50 bg-background shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-md border-border/50 shadow-lg">
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
                      <div className="ml-1 space-y-2 pt-1">
                        {pautasGroup.map((pauta, index) => (
                          <div
                            key={pauta.id}
                            className="group/item rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 overflow-hidden animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            {/* Card Header with Title and Actions */}
                            <div className="p-3 space-y-2.5">
                              {/* Title Row */}
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-semibold text-foreground leading-tight flex-1 min-w-0">
                                  {pauta.titulo}
                                </h4>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-md hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:text-blue-400 transition-colors"
                                    onClick={(e) => handleEditPauta(pauta, e)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={(e) => handlePrintPauta(pauta, e)}
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="sr-only">PDF</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={(e) => handleDeletePauta(pauta, e)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </div>
                              </div>

                              {/* Status Dropdown */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-medium">Status:</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={`h-6 px-2 text-[10px] font-medium ${getStatusColor(pauta.status || 'pendente')} border-none`}
                                    >
                                      {getStatusLabel(pauta.status || 'pendente')}
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-40">
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(pauta, 'pendente')}
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        Pendente
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(pauta, 'em_andamento')}
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        Em Andamento
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(pauta, 'concluida')}
                                      className="text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        Concluída
                                      </div>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Meta Information */}
                              {(pauta.local || pauta.reporter || pauta.data_cobertura) && (
                                <div className="flex flex-col gap-1.5 pt-1 border-t border-border/30">
                                  {pauta.local && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
                                      <span className="text-[10px] text-muted-foreground truncate">
                                        {pauta.local}
                                      </span>
                                    </div>
                                  )}
                                  {pauta.reporter && (
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
                                      <span className="text-[10px] text-muted-foreground truncate">
                                        {pauta.reporter}
                                      </span>
                                    </div>
                                  )}
                                  {pauta.data_cobertura && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
                                      <span className="text-[10px] text-muted-foreground">
                                        {pauta.data_cobertura}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
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
