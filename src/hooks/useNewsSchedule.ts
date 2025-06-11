import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import {
  Bloco,
  Materia,
  Telejornal
} from "@/types";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeMaterias } from "@/hooks/realtime-materias";

type BlockWithItems = Bloco & {
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (item: Materia) => void;
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
}

export const useNewsSchedule = ({
  selectedJournal,
  currentTelejornal,
  onEditItem,
  externalBlocks,
  onBlocksChange
}: UseNewsScheduleProps) => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<Materia | null>(null);

  // Use external blocks if provided, otherwise use internal blocks
  const currentBlocks = externalBlocks || blocks;

  // Realtime materias updates
  const {
    blocks: realtimeBlocks,
    setBlocks: setRealtimeBlocks
  } = useRealtimeMaterias({
    selectedJournal,
    newItemBlock,
    materiaToDelete
  });

  // Update internal blocks or external blocks based on the presence of externalBlocks
  const updateBlocks = useCallback((newBlocks: BlockWithItems[]) => {
    if (externalBlocks && onBlocksChange) {
      // Update external blocks via callback
      onBlocksChange(newBlocks);
    } else {
      // Update internal blocks
      setBlocks(newBlocks);
    }
  }, [externalBlocks, onBlocksChange]);

  // Use realtimeBlocks if available, otherwise use currentBlocks
  useEffect(() => {
    if (realtimeBlocks && realtimeBlocks.length > 0) {
      updateBlocks(realtimeBlocks);
    }
  }, [realtimeBlocks, updateBlocks]);

  // Fetch blocks and materias on journal selection
  useEffect(() => {
    const fetchBlocksAndMaterias = async () => {
      if (!selectedJournal) {
        updateBlocks([]);
        setTotalJournalTime(0);
        return;
      }

      setIsLoading(true);

      try {
        // Fetch blocks for the selected journal
        const { data: blocksData, error: blocksError } = await supabase
          .from('blocos')
          .select('*')
          .eq('telejornal_id', selectedJournal)
          .order('ordem', { ascending: true });

        if (blocksError) {
          console.error("Erro ao buscar blocos:", blocksError);
          toast({
            title: "Erro ao buscar blocos",
            description: blocksError.message,
            variant: "destructive"
          });
          return;
        }

        // Fetch materias for each block
        const blocksWithMaterias = await Promise.all(
          blocksData.map(async (block: Bloco) => {
            const { data: materiasData, error: materiasError } = await supabase
              .from('materias')
              .select('*')
              .eq('bloco_id', block.id)
              .order('ordem', { ascending: true });

            if (materiasError) {
              console.error(`Erro ao buscar matérias para o bloco ${block.id}:`, materiasError);
              toast({
                title: `Erro ao buscar matérias para o bloco ${block.id}`,
                description: materiasError.message,
                variant: "destructive"
              });
              return { ...block, items: [], totalTime: 0 }; // Return block with empty items to avoid breaking the app
            }

            const items = materiasData.map(item => ({
              ...item,
              titulo: item.retranca || "Sem título"
            })) as Materia[];

            const totalTime = calculateBlockTotalTime(items);

            return { ...block, items, totalTime };
          })
        );

        updateBlocks(blocksWithMaterias);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro ao buscar dados",
          description: "Ocorreu um erro ao buscar os dados do telejornal.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        setIsCreatingFirstBlock(false);
      }
    };

    fetchBlocksAndMaterias();
  }, [selectedJournal, toast, updateBlocks]);

  // Calculate total journal time whenever blocks change
  useEffect(() => {
    const calculateTotalTime = () => {
      const total = currentBlocks.reduce((acc, block) => acc + block.totalTime, 0);
      setTotalJournalTime(total);
    };

    calculateTotalTime();
  }, [currentBlocks]);

  // Add a new item to a block
  const handleAddItem = async (blockId: string) => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para adicionar um item.",
        variant: "destructive"
      });
      return;
    }

    setNewItemBlock(blockId);

    // Find the block to add the item to
    const block = currentBlocks.find(block => block.id === blockId);

    if (!block) {
      toast({
        title: "Bloco não encontrado",
        description: "O bloco especificado não foi encontrado.",
        variant: "destructive"
      });
      return;
    }

    // Calculate the order for the new item (last + 1)
    const newOrder = block.items.length > 0
      ? Math.max(...block.items.map(item => item.ordem)) + 1
      : 0;

    // Create a temporary item
    const tempItem: Materia = {
      id: `temp-${uuidv4()}`,
      bloco_id: blockId,
      ordem: newOrder,
      duracao: 0,
      retranca: "Nova Matéria",
      titulo: "Nova Matéria"
    };

    // Optimistically update the UI
    updateBlocks(currentBlocks.map(b =>
      b.id === blockId
        ? { ...b, items: [...b.items, tempItem] }
        : b
    ));

    try {
      // Persist the new item to the database
      const { error } = await supabase
        .from('materias')
        .insert({
          bloco_id: blockId,
          ordem: newOrder,
          duracao: 0,
          retranca: "Nova Matéria"
        });

      if (error) {
        console.error("Erro ao criar matéria:", error);
        toast({
          title: "Erro ao criar matéria",
          description: error.message,
          variant: "destructive"
        });

        // Revert the UI update on failure
        updateBlocks(currentBlocks.map(b =>
          b.id === blockId
            ? { ...b, items: b.items.filter(item => item.id !== tempItem.id) }
            : b
        ));
      }
    } finally {
      setNewItemBlock(null);
    }
  };

  // Duplicate an existing item
  const handleDuplicateItem = async (item: Materia) => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para duplicar um item.",
        variant: "destructive"
      });
      return;
    }

    // Generate a new UUID for the duplicated item
    const newItemId = uuidv4();

    try {
      // Persist the duplicated item to the database
      const { error } = await supabase
        .from('materias')
        .insert({
          id: newItemId,
          bloco_id: item.bloco_id,
          ordem: item.ordem + 0.1, // Add a small increment to the order
          duracao: item.duracao,
          retranca: `Cópia de ${item.retranca}`,
          clip: item.clip,
          tempo_clip: item.tempo_clip,
          texto: item.texto,
          cabeca: item.cabeca,
          gc: item.gc,
          status: item.status,
          pagina: item.pagina,
          reporter: item.reporter,
          tipo_material: item.tipo_material
        });

      if (error) {
        console.error("Erro ao duplicar matéria:", error);
        toast({
          title: "Erro ao duplicar matéria",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      // No need to update the UI manually, the realtime subscription will handle it
    }
  };

  // Delete a materia
  const handleDeleteMateria = (item: Materia) => {
    setMateriaToDelete(item);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete materia
  const confirmDeleteMateria = async () => {
    if (!materiaToDelete) {
      toast({
        title: "Nenhuma matéria selecionada",
        description: "Selecione uma matéria para excluir.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    setDeleteConfirmOpen(false);

    try {
      // Delete the item from the database
      const { error } = await supabase
        .from('materias')
        .delete()
        .eq('id', materiaToDelete.id);

      if (error) {
        console.error("Erro ao excluir matéria:", error);
        toast({
          title: "Erro ao excluir matéria",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsDeleting(false);
      setMateriaToDelete(null);
    }
  };

  // Batch delete materias
  const handleBatchDeleteMaterias = async (items: Materia[]) => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para excluir os itens.",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Delete the items from the database
      const { error } = await supabase
        .from('materias')
        .delete()
        .in('id', items.map(item => item.id));

      if (error) {
        console.error("Erro ao excluir matérias:", error);
        toast({
          title: "Erro ao excluir matérias",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Renumber items
  const handleRenumberItems = () => {
    setRenumberConfirmOpen(true);
  };

  // Confirm renumber items
  const confirmRenumberItems = async () => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para reordenar os itens.",
        variant: "destructive"
      });
      return;
    }

    setRenumberConfirmOpen(false);

    try {
      // Get all materias from all blocks
      const allMaterias = currentBlocks.reduce((acc, block) => acc.concat(block.items), []);

      // Sort all materias by bloco_id and ordem
      const sortedMaterias = [...allMaterias].sort((a, b) => {
        if (a.bloco_id === b.bloco_id) {
          return a.ordem - b.ordem;
        }
        return 0;
      });

      // Update the order of all materias
      let order = 0;
      const updates = sortedMaterias.map(item => ({
        id: item.id,
        ordem: order++
      }));

      // Persist the updates to the database
      const { error } = await supabase
        .from('materias')
        .upsert(updates);

      if (error) {
        console.error("Erro ao reordenar matérias:", error);
        toast({
          title: "Erro ao reordenar matérias",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      // No need to update the UI manually, the realtime subscription will handle it
    }
  };

  // Add a first block
  const handleAddFirstBlock = async () => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para adicionar um bloco.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingFirstBlock(true);

    // Generate a new UUID for the block
    const newBlockId = uuidv4();

    try {
      // Persist the new block to the database
      const { error } = await supabase
        .from('blocos')
        .insert({
          id: newBlockId,
          telejornal_id: selectedJournal,
          nome: "Novo Bloco",
          ordem: 0
        });

      if (error) {
        console.error("Erro ao criar bloco:", error);
        toast({
          title: "Erro ao criar bloco",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsCreatingFirstBlock(false);
    }
  };

  // Add a block
  const handleAddBlock = async () => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para adicionar um bloco.",
        variant: "destructive"
      });
      return;
    }

    // Generate a new UUID for the block
    const newBlockId = uuidv4();

    // Calculate the order for the new block (last + 1)
    const newOrder = currentBlocks.length > 0
      ? Math.max(...currentBlocks.map(block => block.ordem)) + 1
      : 0;

    try {
      // Persist the new block to the database
      const { error } = await supabase
        .from('blocos')
        .insert({
          id: newBlockId,
          telejornal_id: selectedJournal,
          nome: "Novo Bloco",
          ordem: newOrder
        });

      if (error) {
        console.error("Erro ao criar bloco:", error);
        toast({
          title: "Erro ao criar bloco",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      // No need to update the UI manually, the realtime subscription will handle it
    }
  };

  // Rename a block
  const handleRenameBlock = async (blockId: string, newName: string) => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para renomear um bloco.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Persist the block rename to the database
      const { error } = await supabase
        .from('blocos')
        .update({ nome: newName })
        .eq('id', blockId);

      if (error) {
        console.error("Erro ao renomear bloco:", error);
        toast({
          title: "Erro ao renomear bloco",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      // No need to update the UI manually, the realtime subscription will handle it
    }
  };

  // Delete a block
  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para excluir um bloco.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Delete the block from the database
      const { error } = await supabase
        .from('blocos')
        .delete()
        .eq('id', blockId);

      if (error) {
        console.error("Erro ao excluir bloco:", error);
        toast({
          title: "Erro ao excluir bloco",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      // No need to update the UI manually, the realtime subscription will handle it
    }
  };

  // Handle drag end
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === 'block') {
      // Reorder blocks
      const newBlocks = [...currentBlocks];
      const [removed] = newBlocks.splice(source.index, 1);
      newBlocks.splice(destination.index, 0, removed);

      // Update the order of the blocks
      const updates = newBlocks.map((block, index) => ({
        id: block.id,
        ordem: index
      }));

      // Persist the updates to the database
      const { error } = await supabase
        .from('blocos')
        .upsert(updates);

      if (error) {
        console.error("Erro ao reordenar blocos:", error);
        toast({
          title: "Erro ao reordenar blocos",
          description: error.message,
          variant: "destructive"
        });
      }

      return;
    }

    if (type === 'materia') {
      // Reorder materias
      const sourceBlockId = source.droppableId;
      const destinationBlockId = destination.droppableId;

      // Get the source and destination blocks
      const sourceBlock = currentBlocks.find(block => block.id === sourceBlockId);
      const destinationBlock = currentBlocks.find(block => block.id === destinationBlockId);

      if (!sourceBlock || !destinationBlock) {
        toast({
          title: "Bloco não encontrado",
          description: "O bloco especificado não foi encontrado.",
          variant: "destructive"
        });
        return;
      }

      // Get the source and destination items
      const sourceItems = [...sourceBlock.items];
      const destinationItems = sourceBlockId === destinationBlockId ? sourceItems : [...destinationBlock.items];

      // Remove the item from the source
      const [removed] = sourceItems.splice(source.index, 1);

      // Add the item to the destination
      destinationItems.splice(destination.index, 0, removed);

      // Update the order of the items
      const updates = destinationItems.map((item, index) => ({
        id: item.id,
        bloco_id: destinationBlockId,
        ordem: index
      }));

      // If the source and destination blocks are different, update the source block items
      if (sourceBlockId !== destinationBlockId) {
        const sourceUpdates = sourceItems.map((item, index) => ({
          id: item.id,
          bloco_id: sourceBlockId,
          ordem: index
        }));

        updates.push(...sourceUpdates);
      }

      // Persist the updates to the database
      const { error } = await supabase
        .from('materias')
        .upsert(updates);

      if (error) {
        console.error("Erro ao reordenar matérias:", error);
        toast({
          title: "Erro ao reordenar matérias",
          description: error.message,
          variant: "destructive"
        });
      }

      return;
    }
  };

  const openTeleprompter = () => {
    if (currentTelejornal) {
      supabase
        .from('telejornais')
        .update({ espelho_aberto: true })
        .eq('id', currentTelejornal.id)
        .then(() => {
          toast({
            title: "Teleprompter aberto",
            description: "O teleprompter foi aberto.",
          });
        })
        .catch(error => {
          console.error("Erro ao abrir teleprompter:", error);
          toast({
            title: "Erro ao abrir teleprompter",
            description: error.message,
            variant: "destructive"
          });
        });
    }
  };

  return {
    blocks: currentBlocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    isDeleting,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleBatchDeleteMaterias,
    handleRenumberItems,
    confirmRenumberItems,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock,
    handleDragEnd,
    openTeleprompter
  };
};
