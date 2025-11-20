
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock, PlusCircle, Eye, FileText, Download, Save, FolderOpen, Menu, BookOpen } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal, Materia, Bloco } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
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
  onViewLaudas?: () => void;
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
  onViewLaudas,
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-muted-foreground mt-1 cursor-help">
                  {currentTelejornal?.created_at 
                    ? new Date(currentTelejornal.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : new Date().toLocaleDateString('pt-BR')
                  }
                  {currentTelejornal?.created_at && (
                    <span className="ml-2 text-xs">
                      (Criado às {new Date(currentTelejornal.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })})
                    </span>
                  )}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  {currentTelejornal?.created_at && (
                    <>
                      <p><strong>Espelho criado em:</strong></p>
                      <p>{new Date(currentTelejornal.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</p>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Desktop: Tempo Total | Mobile: Menu Espelho */}
        <div className="flex-shrink-0">
          {!isMobile ? (
            /* Tempo Total - Desktop */
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-muted-foreground">Tempo Total:</p>
              <p className="text-3xl font-bold text-foreground">{formatTime(totalJournalTime)}</p>
            </div>
          ) : (
            /* Menu Espelho - Mobile */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4 mr-2" />
                  Menu Espelho
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white z-50">
                <DropdownMenuLabel>Ações do Espelho</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
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
                
                <DropdownMenuItem 
                  onClick={onViewTeleprompter}
                  disabled={!currentTelejornal?.espelho_aberto}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Teleprompter
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={onViewLaudas}
                  disabled={!currentTelejornal?.espelho_aberto}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Visualizar Laudas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Seção de Botões - Apenas Desktop */}
      {!isMobile && (
        <div className="px-4 pb-4">
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
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewLaudas}
                disabled={!currentTelejornal?.espelho_aberto}
                className={!currentTelejornal?.espelho_aberto ? "opacity-50 cursor-not-allowed" : ""}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Visualizar Laudas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
