
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
  const columns = [
    { id: 'pagina', label: 'Página', minWidth: 80, defaultWidth: 100 },
    { id: 'notas', label: 'Notas', minWidth: 100, defaultWidth: 120 },
    { id: 'retranca', label: 'Retranca', minWidth: 150, defaultWidth: 200 },
    { id: 'clipe', label: 'Clipe', minWidth: 100, defaultWidth: 120 },
    { id: 'duracao', label: 'Duração', minWidth: 80, defaultWidth: 100 },
    { id: 'status', label: 'Status', minWidth: 100, defaultWidth: 120 },
    { id: 'reporter', label: 'Repórter', minWidth: 120, defaultWidth: 150 },
    { id: 'acoes', label: 'Ações', minWidth: 120, defaultWidth: 140 }
  ];

  return (
    <Droppable droppableId={blockId}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <ResizableGrid columns={columns} isBatchMode={isBatchMode}>
            {items.length === 0 ? (
              <div className="py-8 text-center text-gray-500 min-h-[80px] flex items-center justify-center">
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
  );
};
