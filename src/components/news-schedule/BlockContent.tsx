
import { Materia } from "@/types";
import { NewsItem } from "./NewsItem";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface BlockContentProps {
  blockId: string;
  items: Materia[];
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  onCopyItem: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModifyItems: boolean;
  
  // Batch selection props
  isBatchMode?: boolean;
  isSelected?: (id: string) => boolean;
  onToggleSelection?: (id: string) => void;
  
  // Visual selection props
  selectedItemId?: string | null;
  onItemClick?: (item: Materia) => void;
}

export const BlockContent = ({
  blockId,
  items,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onCopyItem,
  isEspelhoOpen,
  canModifyItems,
  isBatchMode = false,
  isSelected,
  onToggleSelection,
  selectedItemId,
  onItemClick
}: BlockContentProps) => {
  console.log('BlockContent: selectedItemId =', selectedItemId);
  console.log('BlockContent: onItemClick =', !!onItemClick);

  const handleItemClick = (item: Materia) => {
    console.log('BlockContent: handleItemClick chamado para:', item.retranca);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleCopyItem = (item: Materia) => {
    console.log('BlockContent: Copiando item:', item.retranca);
    onCopyItem(item);
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Nenhuma matéria neste bloco
      </div>
    );
  }

  return (
    <div className="p-4">
      <Droppable droppableId={`block-${blockId}`} type="MATERIA">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {items.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}
                isDragDisabled={!isEspelhoOpen || !canModifyItems}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "opacity-50" : ""}
                  >
                    <NewsItem
                      item={item}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                      onDuplicate={onDuplicateItem}
                      onCopy={handleCopyItem}
                      isEspelhoOpen={isEspelhoOpen}
                      canModifyItems={canModifyItems}
                      isSelected={selectedItemId === item.id}
                      onItemClick={handleItemClick}
                      isBatchMode={isBatchMode}
                      onToggleSelection={onToggleSelection}
                      isSelectedForBatch={isSelected ? isSelected(item.id) : false}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
