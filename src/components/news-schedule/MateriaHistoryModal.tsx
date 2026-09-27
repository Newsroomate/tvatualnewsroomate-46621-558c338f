import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchMateriaHistory, MateriaEditHistoryEntry } from "@/services/materia-history-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, UserCircle, PenLine, PlusCircle } from "lucide-react";
import { Materia } from "@/types";

interface MateriaHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  materia: Materia | null;
}

export const MateriaHistoryModal = ({ isOpen, onClose, materia }: MateriaHistoryModalProps) => {
  const [history, setHistory] = useState<MateriaEditHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && materia) {
      setIsLoading(true);
      fetchMateriaHistory(materia.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, materia]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Criou a matéria';
      case 'update': return 'Editou a matéria';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <PlusCircle className="h-4 w-4 text-green-500" />;
      case 'update': return <PenLine className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="text-base">
            Histórico — {materia?.retranca || 'Matéria'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro encontrado</p>
          ) : (
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="relative flex gap-3">
                    {/* Timeline dot */}
                    <div className="absolute -left-6 top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-background border border-border">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        {getActionIcon(entry.action)}
                        <span className="font-medium truncate">{entry.user_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{getActionLabel(entry.action)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
