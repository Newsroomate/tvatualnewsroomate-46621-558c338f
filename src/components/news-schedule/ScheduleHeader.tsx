
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock, PlusCircle, Eye, FileText, Download, Save, FolderOpen, Menu } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal, Materia, Bloco } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generateGCTextFile } from "@/utils/gc-txt-utils";
import { exportPlayoutPDF } from "@/utils/playout-export-utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const handleExportGC = () => {
    generateGCTextFile(blocks, currentTelejornal);
  };

  const handleExportPlayout = () => {
    exportPlayoutPDF(blocks, currentTelejornal);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Header Principal */}
      <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Informações do Telejornal */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">
            {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        {/* Tempo Total - Apenas Desktop */}
        {!isMobile && (
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-sm font-medium text-muted-foreground">Tempo Total:</p>
            <p className="text-3xl font-bold text-foreground">{formatTime(totalJournalTime)}</p>
          </div>
        )}
      </div>
      
      {/* Actions Section - Conditional Layout */}
      <div className="px-4 pb-4">
        {isMobile ? (
          /* Mobile: Menu Espelho Dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                Menu Espelho
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Gerenciar Espelho</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={onAddBlock}
                disabled={!currentTelejornal?.espelho_aberto}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Novo Bloco
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onRenumberItems}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
              >
                <ArrowDownUp className="h-4 w-4 mr-2" />
                Reordenar Numeração
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Modelos</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={onSaveModel}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Modelo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onViewSavedModels}
                disabled={!currentTelejornal?.espelho_aberto}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Modelos Salvos
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Exportações</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleExportGC}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar GC
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportPlayout}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PLAYOUT
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Visualização</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={onViewTeleprompter}
                disabled={!currentTelejornal?.espelho_aberto}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Teleprompter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Desktop: Original Button Layout */
          <div className="flex flex-wrap gap-2">
            {/* Ações Principais */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onAddBlock}
                disabled={!currentTelejornal?.espelho_aberto}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Novo Bloco
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onRenumberItems} 
                        disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
                        className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
                      >
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
            </div>
            
            {/* Modelos */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSaveModel}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Modelo
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewSavedModels}
                disabled={!currentTelejornal?.espelho_aberto}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Modelos Salvos
              </Button>
            </div>
            
            {/* Exportações */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportGC}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar GC
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPlayout}
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PLAYOUT
              </Button>
            </div>
            
            {/* Visualização */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewTeleprompter}
                disabled={!currentTelejornal?.espelho_aberto}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Teleprompter
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
