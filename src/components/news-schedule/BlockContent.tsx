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
            {/* Unified table layout for both mobile and desktop */}
            <table className="w-full min-w-[800px]">
              <thead className={`bg-gray-50 text-xs uppercase ${isMobile ? 'text-[10px]' : ''}`}>
                <tr>
                  {/* Checkbox column header */}
                  {isBatchMode && (
                    <th className={`py-2 px-2 text-left ${isMobile ? 'w-8' : 'w-12'}`}>Sel.</th>
                  )}
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-12' : 'w-16'}`}>Página</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-16' : 'w-20'}`}>Notas</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-32' : 'w-48'}`}>Retranca</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-16' : 'w-20'}`}>Clipe</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-16' : 'w-20'}`}>Duração</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-20' : 'w-24'}`}>Status</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-20' : 'w-24'}`}>Repórter</th>
                  <th className={`py-2 px-2 text-left ${isMobile ? 'w-16' : 'w-20'}`}>Ações</th>
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
                      isDragDisabled={!isEspelhoOpen || isBatchMode}
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