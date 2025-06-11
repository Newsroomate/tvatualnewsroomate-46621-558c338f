
import { useState } from "react";
import { useHybridMateriaUpdate } from "@/hooks/useHybridMateriaUpdate";
import { useHybridSnapshotData } from "@/hooks/useHybridSnapshotData";
import { useClipboard } from "@/hooks/useClipboard";
import { useItemSelection } from "@/hooks/useItemSelection";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { Materia } from "@/types";
import { EditableMateria } from "../types";

export const useMateriaOperations = (snapshot: ClosedRundownSnapshot) => {
  const [editingMateria, setEditingMateria] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableMateria | null>(null);
  const { updateMateriaHybrid, isSaving } = useHybridMateriaUpdate();
  
  const { 
    hybridData: blocos, 
    isLoading: isLoadingHybrid, 
    error: hybridError,
    refreshData,
    updateLocalMateria
  } = useHybridSnapshotData({ snapshot });

  const { selectedMateria, selectItem, clearSelection, isSelected } = useItemSelection();
  const { copyMateria } = useClipboard();

  // Função para converter matéria híbrida em formato Materia padrão com TODOS os campos preservados
  const convertToStandardMateria = (materia: any, blocoId: string, blocoNome: string): Materia => {
    return {
      id: materia.id,
      bloco_id: blocoId,
      ordem: materia.ordem || 0,
      retranca: materia.retranca || '',
      clip: materia.clip || '',
      tempo_clip: materia.tempo_clip || '',
      duracao: materia.duracao || 0,
      texto: materia.texto || '',
      cabeca: materia.cabeca || '',
      gc: materia.gc || '',
      status: materia.status || 'draft',
      pagina: materia.pagina || '',
      reporter: materia.reporter || '',
      local_gravacao: materia.local_gravacao || '',
      tags: materia.tags || [],
      equipamento: materia.equipamento || '',
      horario_exibicao: materia.horario_exibicao,
      updated_at: materia.updated_at,
      tipo_material: materia.tipo_material || '',
      titulo: materia.retranca || '',
      descricao: materia.texto || '',
      tempo_estimado: materia.duracao || 0,
      apresentador: materia.reporter || '',
      link_vt: materia.clip || '',
      created_at: materia.created_at
    };
  };

  const handleCopyMateria = (materia: any, blocoId: string, blocoNome: string) => {
    console.log('Copiando matéria do histórico:', {
      id: materia.id,
      retranca: materia.retranca,
      texto: materia.texto,
      duracao: materia.duracao,
      todos_campos: materia
    });
    
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    console.log('Matéria convertida para formato padrão:', standardMateria);
    
    copyMateria(standardMateria);
    selectItem(standardMateria);
  };

  const handleSelectMateria = (materia: any, blocoId: string, blocoNome: string) => {
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    selectItem(standardMateria);
  };

  const handleEditMateria = (materia: any, blocoId: string, blocoNome: string, blocoOrdem: number) => {
    if (!materia || !materia.id) {
      return;
    }
    
    setEditingMateria(materia.id);
    setEditData({
      id: materia.id,
      retranca: materia.retranca || '',
      clip: materia.clip || '',
      duracao: materia.duracao || 0,
      texto: materia.texto || '',
      cabeca: materia.cabeca || '',
      gc: materia.gc || '',
      status: materia.status || 'draft',
      pagina: materia.pagina || '',
      reporter: materia.reporter || '',
      ordem: materia.ordem || 0,
      tags: materia.tags || [],
      local_gravacao: materia.local_gravacao || '',
      equipamento: materia.equipamento || '',
      bloco_id: blocoId,
      bloco_nome: blocoNome,
      bloco_ordem: blocoOrdem,
      tipo_material: materia.tipo_material || '',
      tempo_clip: materia.tempo_clip || ''
    });
  };

  const handleSaveMateria = async () => {
    if (!editData) {
      return;
    }

    if (!editData.retranca || !editData.retranca.trim()) {
      return;
    }

    if (!editData.id) {
      return;
    }

    try {
      console.log("Iniciando salvamento híbrido da matéria:", {
        id: editData.id,
        retranca: editData.retranca,
        bloco_id: editData.bloco_id,
        bloco_nome: editData.bloco_nome
      });
      
      updateLocalMateria(editData.id, editData);
      
      const isFromSnapshot = !editData.bloco_id || editData.bloco_id === '';
      
      const updatedMateria = await updateMateriaHybrid(
        editData,
        isFromSnapshot,
        snapshot.id
      );
      
      console.log("Matéria atualizada com sucesso:", updatedMateria);

      setEditingMateria(null);
      setEditData(null);
    } catch (error: any) {
      console.error("Erro ao salvar matéria:", error);
      refreshData();
    }
  };

  const handleCancelEdit = () => {
    setEditingMateria(null);
    setEditData(null);
  };

  const handleUpdateEditData = (updates: Partial<EditableMateria>) => {
    setEditData(prev => prev ? { ...prev, ...updates } : null);
  };

  return {
    blocos,
    isLoadingHybrid,
    hybridError,
    refreshData,
    editingMateria,
    editData,
    isSaving,
    selectedMateria,
    isSelected,
    handleCopyMateria,
    handleSelectMateria,
    handleEditMateria,
    handleSaveMateria,
    handleCancelEdit,
    handleUpdateEditData
  };
};
