import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Hash, Monitor, Download, FileText } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal, Bloco, Materia } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MateriaSelectionModal } from "../MateriaSelectionModal";
import { LaudaExportModal } from "../LaudaExportModal";

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  onAddBlock: () => void;
  onViewTeleprompter: () => void;
  onExportClipRetranca: () => void;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
}

export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks,
  onAddBlock,
  onViewTeleprompter,
  onExportClipRetranca,
  blocks
}: ScheduleHeaderProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);
  const [showLaudaSelectionModal, setShowLaudaSelectionModal] = useState(false);
  const [showLaudaExportModal, setShowLaudaExportModal] = useState(false);
  const [selectedMateriasForExport, setSelectedMateriasForExport] = useState<Materia[]>([]);

  const handleExportLauda = () => {
    setShowLaudaSelectionModal(true);
  };

  const handleMateriasSelected = (selectedMaterias: Materia[]) => {
    setSelectedMateriasForExport(selectedMaterias);
    setShowLaudaSelectionModal(false);
    setShowLaudaExportModal(true);
  };

  const handleCloseLaudaModals = () => {
    setShowLaudaSelectionModal(false);
    setShowLaudaExportModal(false);
    setSelectedMateriasForExport([]);
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4 space-y-4">
        {currentTelejornal && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-semibold">{currentTelejornal.nome}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Horário: {currentTelejornal.horario || 'Não definido'}</span>
                  <span>Tempo Total: {formatTime(totalJournalTime)}</span>
                  <span className={`font-medium ${
                    currentTelejornal.espelho_aberto ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentTelejornal.espelho_aberto ? 'ABERTO' : 'FECHADO'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasBlocks && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRenumberItems}
                          disabled={!currentTelejornal.espelho_aberto || !canModify}
                        >
                          <Hash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Reorganizar numeração das matérias
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onViewTeleprompter}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Abrir Teleprompter
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onExportClipRetranca}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Exportar Clip/Retranca
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportLauda}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Exportar Lauda do Repórter
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onAddBlock}
                      disabled={!currentTelejornal.espelho_aberto || !canModify}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Bloco
                    </Button>
                  </TooltipTrigger>
                  {!currentTelejornal.espelho_aberto && (
                    <TooltipContent>
                      Abra o espelho para adicionar blocos
                    </TooltipContent>
                  )}
                  {!canModify && currentTelejornal.espelho_aberto && (
                    <TooltipContent>
                      Sem permissão para adicionar blocos
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>

      <MateriaSelectionModal
        isOpen={showLaudaSelectionModal}
        onClose={handleCloseLaudaModals}
        blocks={blocks}
        onExportSelected={handleMateriasSelected}
      />

      <LaudaExportModal
        isOpen={showLaudaExportModal}
        onClose={handleCloseLaudaModals}
        selectedMaterias={selectedMateriasForExport}
        blocks={blocks}
        telejornalName={currentTelejornal?.nome || ''}
      />
    </>
  );
};
