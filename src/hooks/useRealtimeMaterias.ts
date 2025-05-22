
import { useState, useEffect } from "react";
import { Materia, Bloco } from "@/types";
import { BlockWithItems } from "./useRealtimeMaterias/utils";
import { useDragTracker } from "./useRealtimeMaterias/useDragTracker";
import { useRealtimeSubscription } from "./useRealtimeMaterias/useRealtimeSubscription";
import { createMateriaOperations } from "./useRealtimeMaterias/materiaOperations";
import { useToast } from "@/hooks/use-toast";

interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
}

/**
 * Custom hook para lidar com assinaturas em tempo real para materias
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  const { toast } = useToast();
  
  // Use o hook de rastreamento de arrastar aprimorado
  const {
    startDragging,
    endDragging,
    trackDragOperation,
    shouldIgnoreRealtimeUpdate,
    markItemAsEdited
  } = useDragTracker();
  
  // Cria manipuladores para operações de matéria
  const {
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete,
    updateExistingMateria
  } = createMateriaOperations(setBlocks);
  
  // Configura inscrição em tempo real
  useRealtimeSubscription({
    selectedJournal,
    newItemBlock,
    materiaToDelete,
    shouldIgnoreRealtimeUpdate,
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete
  });
  
  // Manipula a edição explícita de matéria (tanto para clique de botão quanto para clique duplo)
  const handleMateriaEdit = (materia: Materia) => {
    // Marca este item para ignorar atualizações em tempo real futuras
    markItemAsEdited(materia.id);
    
    // Atualiza a interface imediatamente após a edição
    console.log("Atualizando interface com matéria editada:", materia);
    setBlocks(currentBlocks => {
      return updateExistingMateria(currentBlocks, materia);
    });
  };
  
  // Manipulador para atualização de matéria após salvamento
  const handleMateriaSave = (updatedMateria: Materia) => {
    console.log("Matéria salva, atualizando a interface:", updatedMateria);
    handleMateriaEdit(updatedMateria);
  };
  
  return {
    blocks,
    setBlocks,
    startDragging,
    endDragging,
    trackDragOperation,
    handleMateriaEdit,
    handleMateriaSave
  };
};
