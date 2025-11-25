import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Pauta } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import { generatePautaPDF } from "@/utils/pdf-utils";
import { PautaFilters } from "./pauta/PautaFilters";
import { PautaGroupCollapsible } from "./pauta/PautaGroupCollapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status' | 'reporter'>('date');
  const { toast } = useToast();

  const handleDeletePauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
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
    try {
      await deletePauta(deletingPauta.id);
      onDataChange();
      toast({
        title: "Pauta excluída",
        description: "A pauta foi excluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir pauta:", error);
      toast({
        title: "Erro ao excluir pauta",
        description: "Ocorreu um erro ao excluir a pauta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingPauta(null);
    }
  };

  // Filter and sort pautas
  const filteredAndSortedPautas = useMemo(() => {
    let filtered = pautas;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.titulo.toLowerCase().includes(term) ||
          p.reporter?.toLowerCase().includes(term) ||
          p.local?.toLowerCase().includes(term) ||
          p.produtor?.toLowerCase().includes(term)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const dateA = a.data_cobertura ? new Date(a.data_cobertura).getTime() : 0;
          const dateB = b.data_cobertura ? new Date(b.data_cobertura).getTime() : 0;
          return dateB - dateA;
        case 'title':
          return a.titulo.localeCompare(b.titulo);
        case 'status':
          return (a.status || 'pendente').localeCompare(b.status || 'pendente');
        case 'reporter':
          return (a.reporter || '').localeCompare(b.reporter || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [pautas, searchTerm, sortBy]);

  // Group by status
  const groupedPautas = useMemo(() => {
    const groups: Record<string, Pauta[]> = {
      em_producao: [],
      pendente: [],
      concluida: [],
      cancelada: [],
      outros: []
    };

    filteredAndSortedPautas.forEach((pauta) => {
      const status = pauta.status?.toLowerCase() || 'pendente';
      if (groups[status]) {
        groups[status].push(pauta);
      } else {
        groups.outros.push(pauta);
      }
    });

    return groups;
  }, [filteredAndSortedPautas]);

  const getGroupTitle = (status: string) => {
    switch (status) {
      case 'em_producao': return 'Em Produção';
      case 'pendente': return 'Pendentes';
      case 'concluida': return 'Concluídas';
      case 'cancelada': return 'Canceladas';
      case 'outros': return 'Outros';
      default: return status;
    }
  };

  return (
    <div className="border-t border-border">
      <div className="p-3 pb-2 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Pautas
          </h3>
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

        {/* Filters */}
        {!isLoading && pautas.length > 0 && (
          <PautaFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-32rem)] px-3 pb-3">
        {isLoading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            Carregando pautas...
          </div>
        ) : filteredAndSortedPautas.length === 0 ? (
          <div className="text-xs text-muted-foreground italic py-4 text-center">
            {searchTerm ? 'Nenhuma pauta encontrada' : 'Nenhuma pauta disponível'}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show groups based on priority */}
            <PautaGroupCollapsible
              title={getGroupTitle('em_producao')}
              pautas={groupedPautas.em_producao}
              defaultOpen={true}
              onPrint={handlePrintPauta}
              onDelete={handleDeletePauta}
            />
            <PautaGroupCollapsible
              title={getGroupTitle('pendente')}
              pautas={groupedPautas.pendente}
              defaultOpen={true}
              onPrint={handlePrintPauta}
              onDelete={handleDeletePauta}
            />
            <PautaGroupCollapsible
              title={getGroupTitle('concluida')}
              pautas={groupedPautas.concluida}
              defaultOpen={false}
              onPrint={handlePrintPauta}
              onDelete={handleDeletePauta}
            />
            <PautaGroupCollapsible
              title={getGroupTitle('cancelada')}
              pautas={groupedPautas.cancelada}
              defaultOpen={false}
              onPrint={handlePrintPauta}
              onDelete={handleDeletePauta}
            />
            <PautaGroupCollapsible
              title={getGroupTitle('outros')}
              pautas={groupedPautas.outros}
              defaultOpen={false}
              onPrint={handlePrintPauta}
              onDelete={handleDeletePauta}
            />
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction 
              onClick={confirmDeletePauta} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
