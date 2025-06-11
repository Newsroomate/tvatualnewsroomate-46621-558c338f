
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { FullRundownView } from "@/components/general-schedule/FullRundownView";

interface HistoricoEspelhosModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: ClosedRundownSnapshot | null;
}

export const HistoricoEspelhosModal = ({
  isOpen,
  onClose,
  snapshot
}: HistoricoEspelhosModalProps) => {
  if (!snapshot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">
            Espelho Histórico - {snapshot.nome_telejornal}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <FullRundownView
            snapshot={snapshot}
            onBack={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
