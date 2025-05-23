
import { useState, useEffect } from "react";
import { Materia, Bloco } from "@/types";
import { BlockWithItems } from "./useRealtimeMaterias/utils";
import { useDragTracker } from "./useRealtimeMaterias/useDragTracker";
import { useRealtimeSubscription } from "./useRealtimeMaterias/useRealtimeSubscription";
import { createMateriaOperations } from "./useRealtimeMaterias/materiaOperations";
import { useToast } from "@/hooks/use-toast";
import { fetchMateriasByBloco } from "@/services/materias-api";

interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
  blocosData?: Array<Bloco>;
  isLoading: boolean;
}

/**
 * Custom hook para lidar com assinaturas em tempo real para materias
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete,
  blocosData,
  isLoading
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
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
  
  // Load initial data when blocosData changes and is available
  useEffect(() => {
    const loadInitialData = async () => {
      if (!blocosData || blocosData.length === 0 || isLoading || initialDataLoaded) {
        return;
      }

      try {
        console.log("Loading initial materia data for blocks:", blocosData.map(b => b.id));
        
        // Map blocks to include items and totalTime
        const blocksWithItems = await Promise.all(
          blocosData.map(async (bloco) => {
            try {
              // Fetch materias for each block
              const materias = await fetchMateriasByBloco(bloco.id);
              console.log(`Loaded ${materias.length} materias for block ${bloco.id}`);
              
              // Calculate total time for the block
              const totalTime = materias.reduce((sum, materia) => sum + materia.duracao, 0);
              
              return {
                ...bloco,
                items: materias,
                totalTime
              };
            } catch (error) {
              console.error(`Error loading materias for block ${bloco.id}:`, error);
              return {
                ...bloco,
                items: [],
                totalTime: 0
              };
            }
          })
        );

        console.log("Setting blocks with initial data:", blocksWithItems);
        setBlocks(blocksWithItems);
        setInitialDataLoaded(true);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as matérias. Tente recarregar a página.",
          variant: "destructive"
        });
      }
    };

    loadInitialData();
  }, [blocosData, isLoading, initialDataLoaded, toast]);

  // Reset initialDataLoaded flag when journal changes
  useEffect(() => {
    if (selectedJournal) {
      setInitialDataLoaded(false);
    }
  }, [selectedJournal]);
  
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
    handleMateriaSave,
    initialDataLoaded
  };
};
