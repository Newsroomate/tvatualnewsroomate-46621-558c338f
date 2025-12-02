
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileText, Search, ChevronDown, ChevronRight, User, Calendar, MapPin, Clock } from "lucide-react";
import { Pauta } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
    pendente: { label: "Pendente", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
    em_andamento: { label: "Em Andamento", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
    concluida: { label: "Concluída", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" }
  };
  
  const totalCount = pautas.length;
  const pendenteCount = groupedPautas.pendente.length;
  const emAndamentoCount = groupedPautas.em_andamento.length;

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
    <div className="flex flex-col h-full border-t bg-background">
      {/* Header fixo com design moderno */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight">PAUTAS</h3>
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
              {totalCount}
            </Badge>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 px-2 gap-1.5 shadow-sm" 
            onClick={onAddPauta}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Nova</span>
          </Button>
        </div>
        
        {/* Busca moderna */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pautas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 text-xs bg-background border-border/60 focus:border-primary/40 transition-colors"
          />
        </div>
        
        {/* Tabs de filtros */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/50">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Todas
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[9px]">
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pendente" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Pendentes
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[9px]">
                {pendenteCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="em_andamento" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Em And.
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[9px]">
                {emAndamentoCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista com scroll */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Carregando pautas...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedPautas).map(([status, pautasInGroup]) => {
                if (pautasInGroup.length === 0) return null;
                
                return (
                  <div key={status} className="space-y-2">
                    <Collapsible
                      open={openGroups[status]}
                      onOpenChange={() => toggleGroup(status)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-accent/60 transition-all group">
                        <div className="flex items-center gap-2.5">
                          {openGroups[status] ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                          )}
                          <span className="text-xs font-semibold tracking-tight">{statusLabels[status].label}</span>
                          <Badge 
                            variant="secondary" 
                            className={`h-5 px-2 text-[10px] font-bold ${statusLabels[status].color} ${statusLabels[status].bgColor}`}
                          >
                            {pautasInGroup.length}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-2 mt-2">
                        {pautasInGroup.map(pauta => (
                          <div
                            key={pauta.id}
                            className="group relative p-3 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-semibold leading-snug line-clamp-2 pr-12">
                                  {pauta.titulo}
                                </h4>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                    onClick={(e) => handlePrintPauta(pauta, e)}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="sr-only">PDF</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => handleDeletePauta(pauta, e)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </div>
                              </div>
                              
                              {(pauta.reporter || pauta.data_cobertura || pauta.local || pauta.horario) && (
                                <div className="flex flex-col gap-1.5 pt-1">
                                  {pauta.reporter && (
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <span className="text-[10px] text-muted-foreground font-medium truncate">
                                        {pauta.reporter}
                                      </span>
                                    </div>
                                  )}
                                  {pauta.data_cobertura && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        {pauta.data_cobertura}
                                      </span>
                                      {pauta.horario && (
                                        <>
                                          <Separator orientation="vertical" className="h-3" />
                                          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            {pauta.horario}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {pauta.local && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <span className="text-[10px] text-muted-foreground font-medium truncate">
                                        {pauta.local}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
              
              {pautas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Nenhuma pauta disponível
                  </p>
                  <p className="text-xs text-muted-foreground/70 text-center">
                    Clique em "Nova" para criar sua primeira pauta
                  </p>
                </div>
              )}
              
              {pautas.length > 0 && Object.values(groupedPautas).every(g => g.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Nenhuma pauta encontrada
                  </p>
                  <p className="text-xs text-muted-foreground/70 text-center">
                    Tente ajustar os filtros ou buscar por outro termo
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
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
