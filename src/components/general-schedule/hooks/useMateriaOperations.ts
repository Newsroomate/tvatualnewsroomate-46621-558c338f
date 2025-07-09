import { useState } from "react";
import { useHybridMateriaUpdate } from "@/hooks/useHybridMateriaUpdate";
import { useHybridSnapshotData } from "@/hooks/useHybridSnapshotData";
import { useClipboard } from "@/context/ClipboardContext";
import { useItemSelection } from "@/hooks/useItemSelection";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { Materia } from "@/types";
import { EditableMateria } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useMateriaOperations = (snapshot: ClosedRundownSnapshot) => {
  const [editingMateria, setEditingMateria] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableMateria | null>(null);
  const { updateMateriaHybrid, isSaving } = useHybridMateriaUpdate();
  const { toast } = useToast();
  
  const { 
    hybridData: blocos, 
    isLoading: isLoadingHybrid, 
    error: hybridError,
    refreshData,
    updateLocalMateria
  } = useHybridSnapshotData({ snapshot });

  const { selectedMateria, selectItem, clearSelection, isSelected } = useItemSelection();
  const { copyMateria } = useClipboard();

  // Função melhorada para converter matéria híbrida em formato Materia padrão com TODOS os campos preservados
  const convertToStandardMateria = (materia: any, blocoId: string, blocoNome: string): Materia => {
    console.log('Convertendo matéria com todos os campos:', {
      materiaOriginal: materia,
      camposDetectados: Object.keys(materia),
      blocoInfo: { blocoId, blocoNome }
    });

    // Garantir que todos os campos sejam preservados, incluindo campos novos ou opcionais
    const standardMateria: Materia = {
      // Campos obrigatórios
      id: materia.id,
      bloco_id: blocoId,
      ordem: materia.ordem || 0,
      retranca: materia.retranca || '',
      titulo: materia.retranca || materia.titulo || '',
      
      // Campos de tempo e duração
      duracao: materia.duracao || 0,
      tempo_estimado: materia.tempo_estimado || materia.duracao || 0,
      tempo_clip: materia.tempo_clip || '',
      horario_exibicao: materia.horario_exibicao,
      
      // Campos de conteúdo
      texto: materia.texto || '',
      descricao: materia.descricao || materia.texto || '',
      cabeca: materia.cabeca || '',
      gc: materia.gc || '',
      
      // Campos de mídia
      clip: materia.clip || '',
      link_vt: materia.link_vt || materia.clip || '',
      
      // Campos de pessoas
      reporter: materia.reporter || '',
      apresentador: materia.apresentador || materia.reporter || '',
      
      // Campos de metadados
      status: materia.status || 'draft',
      pagina: materia.pagina || '',
      tipo_material: materia.tipo_material || '',
      
      // Campos de produção
      local_gravacao: materia.local_gravacao || '',
      equipamento: materia.equipamento || '',
      tags: Array.isArray(materia.tags) ? materia.tags : (materia.tags ? [materia.tags] : []),
      
      // Timestamps
      created_at: materia.created_at || new Date().toISOString(),
      updated_at: materia.updated_at || new Date().toISOString(),

      // Campos específicos para compatibilidade com snapshots
      is_from_snapshot: true,
    };

    // Preservar campos extras que podem existir no snapshot mas não na interface padrão
    const extraFields = Object.keys(materia).filter(key => 
      !Object.hasOwnProperty.call(standardMateria, key) && 
      key !== 'bloco_nome' && 
      key !== 'bloco_ordem' && 
      key !== 'isEdited'
    );

    extraFields.forEach(field => {
      (standardMateria as any)[field] = materia[field];
    });

    console.log('Matéria convertida com todos os campos preservados:', {
      camposOriginais: Object.keys(materia).length,
      camposConvertidos: Object.keys(standardMateria).length,
      camposExtras: extraFields,
      materiaFinal: standardMateria
    });

    return standardMateria;
  };

  const handleCopyMateria = (materia: any, blocoId: string, blocoNome: string) => {
    console.log('Iniciando cópia de matéria do histórico com preservação completa:', {
      id: materia.id,
      retranca: materia.retranca,
      todosOsCampos: materia,
      blocoInfo: { blocoId, blocoNome }
    });
    
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    
    // Validar se todos os campos importantes foram preservados
    const camposImportantes = ['retranca', 'texto', 'duracao', 'clip', 'reporter', 'pagina', 'cabeca', 'gc', 'status', 'tipo_material'];
    const camposPreservados = camposImportantes.filter(campo => {
      const original = materia[campo];
      const convertido = standardMateria[campo as keyof Materia];
      return original === convertido || (!original && !convertido);
    });

    console.log('Validação de preservação de campos:', {
      camposImportantes: camposImportantes.length,
      camposPreservados: camposPreservados.length,
      preservacaoCompleta: camposImportantes.length === camposPreservados.length
    });
    
    copyMateria(standardMateria);
    selectItem(standardMateria);

    // Toast melhorado com informações sobre campos preservados
    toast({
      title: "Matéria copiada do histórico",
      description: `"${standardMateria.retranca}" foi copiada com ${Object.keys(standardMateria).length} campos preservados. Use Ctrl+V para colar no espelho atual.`,
    });
  };

  const handleSelectMateria = (materia: any, blocoId: string, blocoNome: string) => {
    console.log('Selecionando matéria:', {
      id: materia.id,
      retranca: materia.retranca,
      bloco: blocoNome
    });
    
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
