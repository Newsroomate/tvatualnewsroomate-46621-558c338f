
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Save, X, RefreshCw, CheckCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { formatTime } from "../news-schedule/utils";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useHybridMateriaUpdate } from "@/hooks/useHybridMateriaUpdate";
import { useHybridSnapshotData } from "@/hooks/useHybridSnapshotData";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClipboard } from "@/hooks/useClipboard";
import { useItemSelection } from "@/hooks/useItemSelection";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Materia } from "@/types";

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
  
  // Usar o novo hook para dados híbridos
  const { 
    hybridData: blocos, 
    isLoading: isLoadingHybrid, 
    error: hybridError,
    refreshData,
    updateLocalMateria
  } = useHybridSnapshotData({ snapshot });

  // Sistema de seleção e clipboard
  const { selectedMateria, selectItem, clearSelection, isSelected } = useItemSelection();
  const { copyMateria } = useClipboard();

  // Função para converter matéria híbrida em formato Materia padrão
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
      created_at: materia.created_at
    };
  };

  // Função para lidar com cópia de matéria
  const handleCopyMateria = (materia: any, blocoId: string, blocoNome: string) => {
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    copyMateria(standardMateria);
    selectItem(standardMateria);
  };

  // Atalhos de teclado para copiar
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: () => {
      if (selectedMateria) {
        copyMateria(selectedMateria);
      }
    },
    onPaste: () => {}, // Não usado no espelho geral
    isEspelhoOpen: true
  });

  const getMateriasList = (bloco: any) => {
    if (bloco.materias && Array.isArray(bloco.materias)) {
      return bloco.materias;
    }
    if (bloco.items && Array.isArray(bloco.items)) {
      return bloco.items;
    }
    return [];
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

    // Validate required fields
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
      
      // Update local state immediately (optimistic update)
      updateLocalMateria(editData.id, editData);
      
      // Determina se é de snapshot baseado na ausência de bloco_id válido
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
      // Em caso de erro, recarregar dados para voltar ao estado anterior
      refreshData();
    }
  };

  const handleCancelEdit = () => {
    setEditingMateria(null);
    setEditData(null);
  };

  const getStatusClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMateriaContent = (materia: any, blocoId: string, blocoNome: string, blocoOrdem: number) => {
    const standardMateria = convertToStandardMateria(materia, blocoId, blocoNome);
    const isSelectedMateria = isSelected(materia.id);

    if (editingMateria === materia.id) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Editando Matéria</h4>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSaveMateria} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Retranca *</label>
              <Input
                value={editData?.retranca || ''}
                onChange={(e) => setEditData(prev => prev ? {...prev, retranca: e.target.value} : null)}
                placeholder="Retranca da matéria"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Clip</label>
              <Input
                value={editData?.clip || ''}
                onChange={(e) => setEditData(prev => prev ? {...prev, clip: e.target.value} : null)}
                placeholder="Código do clip"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duração (segundos)</label>
              <Input
                type="number"
                value={editData?.duracao || 0}
                onChange={(e) => setEditData(prev => prev ? {...prev, duracao: parseInt(e.target.value) || 0} : null)}
                placeholder="0"
                min="0"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select 
                value={editData?.status || 'draft'} 
                onValueChange={(value) => setEditData(prev => prev ? {...prev, status: value} : null)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Página</label>
              <Input
                value={editData?.pagina || ''}
                onChange={(e) => setEditData(prev => prev ? {...prev, pagina: e.target.value} : null)}
                placeholder="Página"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Repórter</label>
              <Input
                value={editData?.reporter || ''}
                onChange={(e) => setEditData(prev => prev ? {...prev, reporter: e.target.value} : null)}
                placeholder="Nome do repórter"
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cabeça</label>
            <Textarea
              value={editData?.cabeca || ''}
              onChange={(e) => setEditData(prev => prev ? {...prev, cabeca: e.target.value} : null)}
              placeholder="Texto da cabeça"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Texto</label>
            <Textarea
              value={editData?.texto || ''}
              onChange={(e) => setEditData(prev => prev ? {...prev, texto: e.target.value} : null)}
              placeholder="Texto da matéria"
              rows={4}
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GC</label>
            <Textarea
              value={editData?.gc || ''}
              onChange={(e) => setEditData(prev => prev ? {...prev, gc: e.target.value} : null)}
              placeholder="Texto do GC"
              rows={2}
              disabled={isSaving}
            />
          </div>
        </div>
      );
    }

    // View Mode
    return (
      <div 
        className={`cursor-pointer p-2 rounded transition-colors ${
          isSelectedMateria ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50'
        }`}
        onClick={() => selectItem(standardMateria)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-lg">{materia.retranca}</h4>
              {materia.isEdited && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Editada
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              {materia.pagina && (
                <Badge variant="outline" className="text-xs">
                  Pág. {materia.pagina}
                </Badge>
              )}
              <Badge className={`text-xs ${getStatusClass(materia.status || 'draft')}`}>
                {materia.status || 'draft'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(materia.duracao || 0)}
              </span>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                handleCopyMateria(materia, blocoId, blocoNome);
              }}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                handleEditMateria(materia, blocoId, blocoNome, blocoOrdem);
              }}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {materia.clip && (
            <div>
              <span className="font-medium">Clip: </span>
              <span className="font-mono">{materia.clip}</span>
            </div>
          )}
          {materia.reporter && (
            <div>
              <span className="font-medium">Repórter: </span>
              <span>{materia.reporter}</span>
            </div>
          )}
          {materia.local_gravacao && (
            <div>
              <span className="font-medium">Local: </span>
              <span>{materia.local_gravacao}</span>
            </div>
          )}
          {materia.equipamento && (
            <div>
              <span className="font-medium">Equipamento: </span>
              <span>{materia.equipamento}</span>
            </div>
          )}
        </div>

        {materia.cabeca && (
          <div className="mt-3">
            <span className="font-medium text-sm">Cabeça:</span>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{materia.cabeca}</p>
          </div>
        )}

        {materia.texto && (
          <div className="mt-3">
            <span className="font-medium text-sm">Texto:</span>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{materia.texto}</p>
          </div>
        )}

        {materia.gc && (
          <div className="mt-3">
            <span className="font-medium text-sm">GC:</span>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{materia.gc}</p>
          </div>
        )}

        {materia.tags && materia.tags.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-sm">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {materia.tags.map((tag: string, tagIndex: number) => (
                <Badge key={tagIndex} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{snapshot.nome_telejornal}</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {format(new Date(snapshot.data_referencia), "dd/MM/yyyy")}
              </Badge>
              {snapshot.horario && (
                <Badge variant="secondary">
                  {snapshot.horario}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hybridError && (
            <span className="text-sm text-red-600">Erro ao carregar alterações</span>
          )}
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Instruções para o usuário */}
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Clique em uma matéria para selecioná-la, depois use <kbd className="bg-blue-200 px-1 rounded">Ctrl+C</kbd> para copiar. 
          Você pode colar com <kbd className="bg-blue-200 px-1 rounded">Ctrl+V</kbd> em qualquer espelho aberto, mesmo após fechar este modal.
        </p>
      </div>

      {/* Blocos */}
      <div className="space-y-6">
        {blocos.map((bloco, blocoIndex) => {
          const materias = getMateriasList(bloco);
          const totalDuracao = materias.reduce((sum: number, item: any) => sum + (item.duracao || 0), 0);
          const editedCount = materias.filter((item: any) => item.isEdited).length;

          return (
            <Card key={bloco.id || `bloco-${blocoIndex}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{bloco.nome}</span>
                    {editedCount > 0 && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        {editedCount} editada{editedCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{materias.length} matérias</span>
                    <span>•</span>
                    <span>{formatTime(totalDuracao)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {materias.map((materia: any, materiaIndex: number) => (
                    <div key={materia.id || `materia-${materiaIndex}`} className="border rounded-lg p-4">
                      {renderMateriaContent(materia, bloco.id, bloco.nome, bloco.ordem || blocoIndex + 1)}
                    </div>
                  ))}

                  {materias.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma matéria neste bloco
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {blocos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum bloco encontrado neste espelho
          </div>
        )}
      </div>
    </div>
  );
};
