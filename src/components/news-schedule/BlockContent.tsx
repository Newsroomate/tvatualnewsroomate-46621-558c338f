
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Materia } from "@/types";
import { NewsItem } from "./NewsItem";
import { useIsMobile } from "@/hooks/use-mobile";

interface BlockContentProps {
  blockId: string;
  items: Materia[];
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  onFocusInTeleprompter?: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModifyItems?: boolean;
  // Batch selection props
  isBatchMode?: boolean;
  isSelected?: (itemId: string) => boolean;
  onToggleSelection?: (itemId: string) => void;
  // Visual selection props
  selectedItemId?: string | null;
  onItemClick?: (materia: Materia) => void;
}

export const BlockContent = ({ 
  blockId, 
  items, 
  onEditItem, 
  onDeleteItem,
  onDuplicateItem,
  onFocusInTeleprompter,
  isEspelhoOpen,
  canModifyItems = true,
  // Batch selection props
  isBatchMode = false,
  isSelected,
  onToggleSelection,
  // Visual selection props
  selectedItemId,
  onItemClick
}: BlockContentProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="overflow-x-auto">
      <Droppable droppableId={blockId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase">
                <tr>
                  {/* Checkbox column header */}
                  {isBatchMode && (
                    <th className="py-3 px-4 text-left w-12">Sel.</th>
                  )}
                  <th className="py-3 px-4 text-left">Página</th>
                  <th className="py-3 px-4 text-left">Notas</th>
                  <th className="py-3 px-4 text-left">Retranca</th>
                  <th className="py-3 px-4 text-left">Clipe</th>
                  <th className="py-3 px-4 text-left">Duração</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Repórter</th>
                  <th className="py-3 px-4 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={isBatchMode ? 9 : 8} className="py-4 text-center text-gray-500">
                      Nenhuma matéria neste bloco
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                      isDragDisabled={!isEspelhoOpen || isBatchMode || isMobile}
                    >
                      {(provided, snapshot) => (
                        <NewsItem
                          item={item}
                          onEdit={onEditItem}
                          onDelete={onDeleteItem}
                          onDuplicate={onDuplicateItem}
                          onFocusInTeleprompter={onFocusInTeleprompter}
                          provided={provided}
                          snapshot={snapshot}
                          isEspelhoOpen={isEspelhoOpen}
                          onDoubleClick={onEditItem}
                          canModify={canModifyItems}
                          isBatchMode={isBatchMode}
                          isSelected={isSelected ? isSelected(item.id) : false}
                          onToggleSelection={onToggleSelection}
                          isVisuallySelected={selectedItemId === item.id}
                          onItemClick={onItemClick}
                          isMobile={isMobile}
                        />
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </tbody>
            </table>
          </div>
        )}
      </Droppable>
    </div>
  );
};
