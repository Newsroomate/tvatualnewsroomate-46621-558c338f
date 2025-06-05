
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Materia } from "@/types";
import { NewsItem } from "./NewsItem";
import { ResizableGrid } from "./ResizableGrid";

interface BlockContentProps {
  blockId: string;
  items: Materia[];
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModifyItems?: boolean;
  // Batch selection props
  isBatchMode?: boolean;
  isSelected?: (itemId: string) => boolean;
  onToggleSelection?: (itemId: string) => void;
}

export const BlockContent = ({ 
  blockId, 
  items, 
  onEditItem, 
  onDeleteItem,
  onDuplicateItem,
  isEspelhoOpen,
  canModifyItems = true,
  // Batch selection props
  isBatchMode = false,
  isSelected,
  onToggleSelection
}: BlockContentProps) => {
  // Define the columns for the resizable grid
  const columns = [
    ...(isBatchMode ? [{ id: 'selection', title: 'Sel.', minWidth: 8, defaultWidth: 8 }] : []),
    { id: 'pagina', title: 'Página', minWidth: 10, defaultWidth: 10 },
    { id: 'notas', title: 'Notas', minWidth: 12, defaultWidth: 12 },
    { id: 'retranca', title: 'Retranca', minWidth: 20, defaultWidth: 25 },
    { id: 'clipe', title: 'Clipe', minWidth: 15, defaultWidth: 15 },
    { id: 'duracao', title: 'Duração', minWidth: 10, defaultWidth: 10 },
    { id: 'status', title: 'Status', minWidth: 12, defaultWidth: 12 },
    { id: 'reporter', title: 'Repórter', minWidth: 15, defaultWidth: 15 },
    { id: 'acoes', title: 'Ações', minWidth: 15, defaultWidth: 15 }
  ];

  return (
    <div className="overflow-hidden">
      <Droppable droppableId={blockId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <ResizableGrid columns={columns}>
              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-gray-50">
                  Nenhuma matéria neste bloco
                </div>
              ) : (
                items.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={!isEspelhoOpen || isBatchMode}
                  >
                    {(provided, snapshot) => (
                      <NewsItem
                        item={item}
                        onEdit={onEditItem}
                        onDelete={onDeleteItem}
                        onDuplicate={onDuplicateItem}
                        provided={provided}
                        snapshot={snapshot}
                        isEspelhoOpen={isEspelhoOpen}
                        onDoubleClick={onEditItem}
                        canModify={canModifyItems}
                        isBatchMode={isBatchMode}
                        isSelected={isSelected ? isSelected(item.id) : false}
                        onToggleSelection={onToggleSelection}
                        useGridLayout={true}
                      />
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </ResizableGrid>
          </div>
        )}
      </Droppable>
    </div>
  );
};
