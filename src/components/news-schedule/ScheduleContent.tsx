
import { Button } from "@/components/ui/button";
import { PlusCircle, Lock } from "lucide-react";
import { Telejornal, Bloco, Materia } from "@/types";
import { NewsBlock } from "./NewsBlock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScheduleContentProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  isLoading: boolean;
  isCreatingFirstBlock: boolean;
  newItemBlock: string | null;
  onOpenRundown: () => void;
  onAddFirstBlock: () => void;
  onAddBlock: () => void;
  onAddItem: (blockId: string) => void;
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
}

export const ScheduleContent = ({
  selectedJournal,
  currentTelejornal,
  blocks,
  isLoading,
  isCreatingFirstBlock,
  newItemBlock,
  onOpenRundown,
  onAddFirstBlock,
  onAddBlock,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: ScheduleContentProps) => {
  if (!selectedJournal) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Selecione um telejornal no painel esquerdo</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Carregando espelho...</p>
      </div>
    );
  }

  if (!currentTelejornal?.espelho_aberto) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-3">
        <div className="flex items-center text-gray-500">
          <Lock className="h-5 w-5 mr-2" />
          <p>O espelho está fechado. Abra o espelho para adicionar e editar matérias.</p>
        </div>
        <Button onClick={onOpenRundown} variant="default">
          Abrir Espelho Agora
        </Button>
      </div>
    );
  }

  if (blocks.length === 0 && isCreatingFirstBlock) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Criando bloco inicial...</p>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-3">
        <p className="text-gray-500">Nenhum bloco encontrado</p>
        <Button onClick={onAddFirstBlock} variant="default">
          Adicionar Bloco Inicial
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Blocks */}
      {blocks.map((block) => (
        <NewsBlock
          key={block.id}
          block={block}
          newItemBlock={newItemBlock}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          isEspelhoOpen={!!currentTelejornal?.espelho_aberto}
        />
      ))}

      {/* Button to add new block */}
      {selectedJournal && currentTelejornal?.espelho_aberto && blocks.length > 0 && (
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={onAddBlock}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Bloco
          </Button>
        </div>
      )}
      
      {/* Button to add new block - disabled version with tooltip */}
      {selectedJournal && !currentTelejornal?.espelho_aberto && (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    variant="outline"
                    disabled={true}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Novo Bloco
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Abra o espelho para adicionar blocos
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
};
