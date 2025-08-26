
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock, PlusCircle, Eye, FileText, Download, Save, FolderOpen } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal, Materia, Bloco } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateGCTextFile } from "@/utils/gc-txt-utils";
import { exportPlayoutPDF } from "@/utils/playout-export-utils";

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  onAddBlock?: () => void;
  onViewTeleprompter?: () => void;
  onExportClipRetranca?: () => void;
  onSaveModel?: () => void;
  onViewSavedModels?: () => void;
  materias?: Materia[];
  blocks?: (Bloco & { items: Materia[] })[];
}

export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks,
  onAddBlock,
  onViewTeleprompter,
  onExportClipRetranca,
  onSaveModel,
  onViewSavedModels,
  materias = [],
  blocks = []
}: ScheduleHeaderProps) => {

  const handleExportGC = () => {
    generateGCTextFile(blocks, currentTelejornal);
  };

  const handleExportPlayout = () => {
    exportPlayoutPDF(blocks, currentTelejornal);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold">
          {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
        </h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddBlock}
          disabled={!currentTelejornal?.espelho_aberto}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Novo Bloco
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSaveModel}
          disabled={!currentTelejornal || !hasBlocks}
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Modelo
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewSavedModels}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Modelos Salvos
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportGC}
          disabled={!currentTelejornal || !hasBlocks}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar GC
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportPlayout}
          disabled={!currentTelejornal || !hasBlocks}
        >
          <FileText className="h-4 w-4 mr-2" />
          Exportar PLAYOUT
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewTeleprompter}
          disabled={!currentTelejornal}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar Teleprompter
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="outline" size="sm" onClick={onRenumberItems} disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}>
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Reordenar Numeração
                </Button>
              </div>
            </TooltipTrigger>
            {!currentTelejornal?.espelho_aberto && (
              <TooltipContent>
                Abra o espelho para reorganizar a numeração
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-right">
          <p className="text-sm font-medium">Tempo Total:</p>
          <p className="text-lg font-bold">{formatTime(totalJournalTime)}</p>
        </div>
      </div>
    </div>
  );
};
