
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Materia } from "@/types";
import { NewsItem } from "./NewsItem";

interface BlockContentProps {
  blockId: string;
  items: Materia[];
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModifyItems?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (itemId: string) => void;
  batchModeEnabled?: boolean;
}

export const BlockContent = ({ 
  blockId, 
  items, 
  onEditItem, 
  onDeleteItem,
  onDuplicateItem,
  isEspelhoOpen,
  canModifyItems = true,
  selectedIds = new Set(),
  onToggleSelection = () => {},
  batchModeEnabled = false
}: BlockContentProps) => {
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
                  {batchModeEnabled && (
                    <th className="py-3 px-4 text-left w-10">Sel.</th>
                  )}
                  <th className="py-3 px-4 text-left">Página</th>
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
                    <td colSpan={batchModeEnabled ? 8 : 7} className="py-4 text-center text-gray-500">
                      Nenhuma matéria neste bloco
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                      isDragDisabled={!isEspelhoOpen}
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
                          isSelected={selectedIds.has(item.id)}
                          onToggleSelection={onToggleSelection}
                          showSelectionCheckbox={batchModeEnabled}
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
