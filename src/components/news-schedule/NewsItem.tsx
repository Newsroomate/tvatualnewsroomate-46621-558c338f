
import { Checkbox } from "@/components/ui/checkbox";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import { MaterialTypeBadge } from "./MaterialTypeBadge";
import { StatusBadge } from "./StatusBadge";
import { NewsItemActions } from "./NewsItemActions";
import { InlineEditCell } from "./InlineEditCell";
import { updateMateria } from "@/services/materias-api";
import { toast } from "@/hooks/use-toast";

interface NewsItemProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  onDuplicate: (item: Materia) => void;
  onFocusInTeleprompter?: (item: Materia) => void;
  provided: any;
  snapshot: any;
  isEspelhoOpen: boolean;
  onDoubleClick: (item: Materia) => void;
  canModify?: boolean;
  // Batch selection props
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (itemId: string) => void;
  // Visual selection props
  isVisuallySelected?: boolean;
  onItemClick?: (materia: Materia) => void;
  // Mobile support
  isMobile?: boolean;
}

export const NewsItem = ({ 
  item, 
  onEdit, 
  onDelete,
  onDuplicate,
  onFocusInTeleprompter,
  provided, 
  snapshot,
  isEspelhoOpen,
  onDoubleClick,
  canModify = true,
  // Batch selection props
  isBatchMode = false,
  isSelected = false,
  onToggleSelection,
  // Visual selection props
  isVisuallySelected = false,
  onItemClick,
  // Mobile support
  isMobile = false
}: NewsItemProps) => {
  // Ensure we have valid data for display
  const displayRetranca = item.retranca || "Sem título";
  const displayStatus = item.status || "draft";
  const displayDuracao = item.duracao || 0;

  const handleCheckboxChange = (checked: boolean) => {
    if (onToggleSelection) {
      onToggleSelection(item.id);
    }
  };

  const handleRowClick = () => {
    if (onItemClick && !isBatchMode) {
      onItemClick(item);
    }
  };

  // Status options for inline editing - exactly matching the edit screen
  const statusOptions = [
    { value: "draft", label: "Rascunho" },
    { value: "review", label: "Em revisão" },
    { value: "approved", label: "Aprovado" },
    { value: "published", label: "Publicado" }
  ];

  // Helper function to get status label in Portuguese  
  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // Handle inline field updates - ensuring exact database field mapping
  const handleInlineUpdate = async (field: string, value: string) => {
    if (!canModify || !isEspelhoOpen) return;

    try {
      // Prepare the update object with proper field mapping
      const updateData: Record<string, any> = {};
      
      // Ensure status field is never empty - default to 'draft'
      if (field === 'status') {
        updateData[field] = value && value.trim() !== '' ? value : 'draft';
      } else if (field === 'reporter') {
        // Allow null/empty for reporter field but handle it properly
        updateData[field] = value && value.trim() !== '' ? value.trim() : null;
      } else {
        // For other fields, preserve the value as-is
        updateData[field] = value;
      }
      
      // Ensure retranca is always present since it's required
      if (field !== 'retranca') {
        updateData.retranca = item.retranca;
      }

      console.log(`Updating ${field} for materia ${item.id}:`, updateData);
      
      await updateMateria(item.id, updateData);
      toast({
        title: "Campo atualizado",
        description: `${field === 'retranca' ? 'Retranca' : field === 'status' ? 'Status' : field === 'reporter' ? 'Repórter' : field} atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o campo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Determine row styling based on selection and drag state
  const getRowStyling = () => {
    let classes = "hover:bg-gray-50 transition-colors cursor-pointer";
    
    if (snapshot.isDragging) {
      classes += " bg-blue-50";
    } else if (isVisuallySelected && !isBatchMode) {
      classes += " bg-gray-100";
    } else if (isSelected && isBatchMode) {
      classes += " bg-blue-50";
    }
    
    return classes;
  };
  
  return (
    <tr 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...(!isMobile ? provided.dragHandleProps : {})}
      className={getRowStyling()}
      onDoubleClick={() => onDoubleClick(item)}
      onClick={handleRowClick}
    >
      {/* Checkbox column for batch selection */}
      {isBatchMode && (
        <td className="py-2 px-4 w-12" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            disabled={!canModify}
          />
        </td>
      )}
      
      <td className="py-2 px-4">{item.pagina}</td>
      <td className="py-2 px-4">
        <MaterialTypeBadge tipoMaterial={item.tipo_material} />
      </td>
      <td className="py-2 px-4 font-medium" onClick={(e) => e.stopPropagation()}>
        <InlineEditCell
          value={displayRetranca}
          onSave={(value) => handleInlineUpdate('retranca', value)}
          disabled={!canModify || !isEspelhoOpen}
          placeholder="Sem título"
        />
      </td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip || ''}</td>
      <td className="py-2 px-4">{formatTime(displayDuracao)}</td>
      <td className="py-2 px-4" onClick={(e) => e.stopPropagation()}>
        <InlineEditCell
          value={item.status || 'draft'}
          onSave={(value) => handleInlineUpdate('status', value)}
          type="status"
          options={statusOptions}
          disabled={!canModify || !isEspelhoOpen}
        />
      </td>
      <td className="py-2 px-4" onClick={(e) => e.stopPropagation()}>
        <InlineEditCell
          value={item.reporter || ''}
          onSave={(value) => handleInlineUpdate('reporter', value)}
          disabled={!canModify || !isEspelhoOpen}
          placeholder="Sem repórter"
        />
      </td>
      <td className="py-2 px-4">
        <NewsItemActions
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onFocusInTeleprompter={onFocusInTeleprompter}
          isEspelhoOpen={isEspelhoOpen}
          canModify={canModify}
        />
      </td>
    </tr>
  );
};
