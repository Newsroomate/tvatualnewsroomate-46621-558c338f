
import { Bloco, Materia, Telejornal } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Lock } from "lucide-react";
import { NewsBlock } from "./NewsBlock";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";
import { DragDropContext } from "@hello-pangea/dnd";

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
  onRenameBlock?: (blockId: string, newName: string) => Promise<void>;
  onDeleteBlock?: (blockId: string) => Promise<void>;
  onDragEnd: (result: any) => void;
  startDragging: () => void;
  endDragging: (itemId?: string, sourceBlockId?: string, destBlockId?: string) => void;
  trackDragOperation: (itemId: string, sourceBlockId: string, destBlockId: string) => void;
  onUpdateItem?: (item: Materia) => void;
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
  onRenameBlock,
  onDeleteBlock,
  onDragEnd,
  startDragging,
  endDragging,
  trackDragOperation,
  onUpdateItem
}: ScheduleContentProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);

  // If no journal selected
  if (!selectedJournal) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Selecione um telejornal no painel esquerdo</p>
      </div>
    );
  }

  // If loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Carregando espelho...</p>
      </div>
    );
  }

  // If espelho is closed
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

  // Creating first block
  if (blocks.length === 0 && isCreatingFirstBlock) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Criando bloco inicial...</p>
      </div>
    );
  }

  // No blocks
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

  // Handler for dragstart event
  const handleDragStart = (start: any) => {
    console.log('Drag started:', start);
    startDragging();
  };

  // Handler for dragend event with enhanced context tracking
  const handleDragEnd = (result: any) => {
    const { draggableId, source, destination } = result;
    
    if (!destination) {
      console.log('Dropped outside a droppable area');
      endDragging();
      return;
    }
    
    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    console.log(`Item ${draggableId} moved from block ${sourceBlockId} (index ${source.index}) to block ${destBlockId} (index ${destination.index})`);
    
    // Track this operation to prevent realtime conflicts
    // This needs to be called BEFORE onDragEnd to ensure tracking is in place
    // before any database updates are triggered
    trackDragOperation(draggableId, sourceBlockId, destBlockId);
    
    // Call the parent's drag end handler
    onDragEnd(result);
    
    // Notify the hook that dragging has ended with detailed context
    // This must come after onDragEnd to ensure state is updated with the drag results
    endDragging(draggableId, sourceBlockId, destBlockId);
  };

  // Render blocks
  return (
    <>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {blocks.map((block) => (
          <NewsBlock
            key={block.id}
            block={block}
            newItemBlock={newItemBlock}
            onAddItem={onAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onRenameBlock={onRenameBlock}
            onDeleteBlock={onDeleteBlock}
            isEspelhoOpen={!!currentTelejornal?.espelho_aberto}
            onUpdateItem={onUpdateItem}
          />
        ))}
      </DragDropContext>

      {/* Button to add new block */}
      <div className="flex justify-center">
        {currentTelejornal?.espelho_aberto && canModify ? (
          <Button 
            variant="outline"
            onClick={onAddBlock}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Bloco
          </Button>
        ) : (
          <Button 
            variant="outline"
            disabled={true}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Bloco
          </Button>
        )}
      </div>
    </>
  );
};
