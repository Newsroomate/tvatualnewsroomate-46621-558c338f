
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useHybridMateriaUpdate } from "@/hooks/useHybridMateriaUpdate";
import { useHybridSnapshotData } from "@/hooks/useHybridSnapshotData";
import { useClipboard } from "@/hooks/useClipboard";
import { useItemSelection } from "@/hooks/useItemSelection";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Materia } from "@/types";
import { FullRundownHeader } from "./full-rundown/FullRundownHeader";
import { BlocoCard } from "./full-rundown/BlocoCard";

interface FullRundownViewProps {
  snapshot: ClosedRundownSnapshot;
  onBack: () => void;
}

interface EditableMateria {
  id: string;
  retranca: string;
  clip?: string;
  duracao: number;
  texto?: string;
  cabeca?: string;
  gc?: string;
  status?: string;
  pagina?: string;
  reporter?: string;
  ordem: number;
  tags?: string[];
  local_gravacao?: string;
  equipamento?: string;
  bloco_id?: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  tipo_material?: string;
  tempo_clip?: string;
}

export const FullRundownView = ({ snapshot, onBack }: FullRundownViewProps) => {
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
  const { copyMateria, hasCopiedMateria } = useClipboard();

  // Função para converter matéria híbrida em formato Materia padrão com TODOS os campos
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
      // Campos para compatibilidade
      titulo: materia.retranca || '',
      descricao: materia.texto || '',
      tempo_estimado: materia.duracao || 0,
      apresentador: materia.reporter || '',
      link_vt: materia.clip || '',
      created_at: materia.created_at,
      // Campo essencial para identificar origem da cópia
      bloco_nome: blocoNome
    };
  };

  // Função para lidar com cópia de matéria - captura TODOS os dados
  const handleCopyMateria = (materia: any, blocoId: string, blocoNome: string) => {
    console.log('Copiando matéria completa:', {
      id: materia.id,
      retranca: materia.retranca,
      bloco_origem: blocoNome,
      campos_copiados: Object.keys(materia)
    });
    
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    copyMateria(standardMateria);
    selectItem(standardMateria);
  };

  // Função para lidar com seleção de matéria
  const handleSelectMateria = (materia: any, blocoId: string, blocoNome: string) => {
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    selectItem(standardMateria);
  };

  // Atalhos de teclado para copiar matéria selecionada
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: () => {
      if (selectedMateria) {
        console.log('Copiando via Ctrl+C:', selectedMateria.retranca);
        copyMateria(selectedMateria);
      }
    },
    onPaste: () => {}, // Paste não funciona aqui, apenas no espelho aberto
    isEspelhoOpen: true
  });

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

  if (isLoadingHybrid) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando dados atualizados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FullRundownHeader
        snapshot={snapshot}
        onBack={onBack}
        onRefresh={refreshData}
        hybridError={hybridError}
        hasCopiedMateria={hasCopiedMateria()}
      />

      {/* Instruções aprimoradas para o usuário */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Como copiar:</strong> Clique em uma matéria para selecioná-la, depois use <kbd className="bg-blue-200 px-1 rounded">Ctrl+C</kbd> para copiar todos os dados. 
          Você pode colar com <kbd className="bg-blue-200 px-1 rounded">Ctrl+V</kbd> em qualquer espelho aberto logo abaixo da matéria selecionada.
          {hasCopiedMateria() && (
            <span className="block mt-1 text-green-700 font-medium">
              ✓ Matéria "{selectedMateria?.retranca}" copiada com todos os dados! Cole em qualquer espelho aberto.
            </span>
          )}
        </p>
      </div>

      {/* Blocos */}
      <div className="space-y-6">
        {blocos.map((bloco, blocoIndex) => (
          <BlocoCard
            key={bloco.id || `bloco-${blocoIndex}`}
            bloco={bloco}
            blocoIndex={blocoIndex}
            editingMateria={editingMateria}
            editData={editData}
            isSaving={isSaving}
            onEditMateria={handleEditMateria}
            onSaveMateria={handleSaveMateria}
            onCancelEdit={handleCancelEdit}
            onUpdateEditData={handleUpdateEditData}
            onSelectMateria={handleSelectMateria}
            onCopyMateria={handleCopyMateria}
            isSelected={isSelected}
          />
        ))}

        {blocos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum bloco encontrado neste espelho
          </div>
        )}
      </div>
    </div>
  );
};
