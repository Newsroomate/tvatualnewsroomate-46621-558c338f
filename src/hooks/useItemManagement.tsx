
import { useState } from 'react';
import { Bloco, Materia, Telejornal } from '@/types';
import { createMateria, deleteMateria } from '@/services/materias-api';
import { useToast } from '@/hooks/use-toast';

interface UseItemManagementProps {
  blocks: (Bloco & { items: Materia[]; totalTime: number; })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[]; totalTime: number; })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemManagement = ({ blocks, setBlocks, currentTelejornal }: UseItemManagementProps) => {
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<Materia | null>(null);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleAddItem = (blockId: string) => {
    setNewItemBlock(blockId);
  };

  const handleDuplicateItem = async (item: Materia) => {
    if (!currentTelejornal?.id) {
      console.log("No current telejornal for duplicating materia");
      return;
    }

    try {
      const { id, created_at, updated_at, ...materiaData } = item;

      const materiaToCreate = {
        ...materiaData,
        bloco_id: item.bloco_id,
        retranca: materiaData.retranca || 'Nova Matéria',
        duracao: materiaData.duracao || 0,
        ordem: materiaData.ordem || 1,
        status: materiaData.status || 'draft'
      };

      await createMateria(materiaToCreate);

      toast({
        title: "Matéria duplicada",
        description: "Matéria duplicada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao duplicar matéria:', error);
      toast({
        title: "Erro ao duplicar matéria",
        description: "Não foi possível duplicar a matéria selecionada",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMateria = (item: Materia) => {
    setMateriaToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMateria = async () => {
    if (!materiaToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMateria(materiaToDelete.id);
      toast({
        title: "Matéria excluída",
        description: "Matéria excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir matéria:', error);
      toast({
        title: "Erro ao excluir matéria",
        description: "Não foi possível excluir a matéria selecionada",
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setMateriaToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleBatchDeleteMaterias = async (materiasToDelete: Materia[]) => {
    if (!materiasToDelete || materiasToDelete.length === 0) return;
  
    setIsDeleting(true);
    try {
      // Delete all materias
      await Promise.all(materiasToDelete.map(materia => deleteMateria(materia.id)));
  
      toast({
        title: "Matérias excluídas",
        description: `${materiasToDelete.length} matérias excluídas com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao excluir matérias:', error);
      toast({
        title: "Erro ao excluir matérias",
        description: "Não foi possível excluir as matérias selecionadas",
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setMateriaToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleRenumberItems = () => {
    setRenumberConfirmOpen(true);
  };

  const confirmRenumberItems = () => {
    setBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        const renumberedItems = block.items.map((item, index) => ({
          ...item,
          ordem: index + 1
        })).sort((a, b) => a.ordem - b.ordem);

        return {
          ...block,
          items: renumberedItems
        };
      });
    });
    setRenumberConfirmOpen(false);
    toast({
      title: "Matérias renumeradas",
      description: "Numeração das matérias atualizada com sucesso",
    });
  };

  const handlePasteMaterias = async (materiasData: Partial<Materia>[], targetMateria?: Materia) => {
    if (!currentTelejornal?.id) {
      console.log("No current telejornal for pasting materias");
      return;
    }

    try {
      // Create the materias with proper typing
      for (const materiaData of materiasData) {
        if (materiaData.bloco_id) {
          const materiaToCreate = {
            bloco_id: materiaData.bloco_id,
            retranca: materiaData.retranca || 'Nova Matéria',
            clip: materiaData.clip || '',
            tempo_clip: materiaData.tempo_clip || '',
            duracao: materiaData.duracao || 0,
            texto: materiaData.texto || '',
            cabeca: materiaData.cabeca || '',
            gc: materiaData.gc || '',
            status: materiaData.status || 'draft',
            pagina: materiaData.pagina || '',
            reporter: materiaData.reporter || '',
            local_gravacao: materiaData.local_gravacao || '',
            tags: materiaData.tags || [],
            equipamento: materiaData.equipamento || '',
            horario_exibicao: materiaData.horario_exibicao || null,
            tipo_material: materiaData.tipo_material || '',
            ordem: materiaData.ordem || 0
          };
          
          await createMateria(materiaToCreate);
        }
      }
      
      toast({
        title: "Matérias coladas",
        description: `${materiasData.length} matéria(s) colada(s) com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao colar matérias:', error);
      toast({
        title: "Erro ao colar matérias",
        description: "Não foi possível colar as matérias selecionadas",
        variant: "destructive"
      });
    }
  };

  return {
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
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
    handlePasteMaterias
  };
};
