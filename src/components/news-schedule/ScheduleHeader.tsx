
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, Eye, Download } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { canCreateEspelhos, canModifyMaterias } from "@/utils/permission";

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  onAddBlock: () => void;
  onViewTeleprompter: () => void;
  onExportEspelhoPDF?: () => void;
}

export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks,
  onAddBlock,
  onViewTeleprompter,
  onExportEspelhoPDF
}: ScheduleHeaderProps) => {
  const { profile } = useAuth();
  const canCreateBlocks = canCreateEspelhos(profile);
  const canModify = canModifyMaterias(profile);

  return (
    <div className="border-b p-4 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {currentTelejornal ? currentTelejornal.nome : "Selecione um telejornal"}
          </h2>
          {currentTelejornal && (
            <p className="text-sm text-gray-600">
              Tempo total: {formatTime(totalJournalTime)}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {currentTelejornal?.espelho_aberto && canModify && hasBlocks && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRenumberItems}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Renumerar
            </Button>
          )}

          {currentTelejornal?.espelho_aberto && canCreateBlocks && (
            <Button 
              size="sm" 
              onClick={onAddBlock}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Bloco
            </Button>
          )}

          {hasBlocks && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onViewTeleprompter}
            >
              <Eye className="h-4 w-4 mr-2" />
              Teleprompter
            </Button>
          )}

          {hasBlocks && onExportEspelhoPDF && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onExportEspelhoPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
