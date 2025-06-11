
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { formatTime } from "../news-schedule/utils";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useHybridMateriaUpdate } from "@/hooks/useHybridMateriaUpdate";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [materiasData, setMateriasData] = useState<any[]>([]);
  const { updateMateriaHybrid, isSaving } = useHybridMateriaUpdate();

  const blocos = snapshot.estrutura_completa.blocos || [];

  // Initialize materias data from snapshot
  useEffect(() => {
    const allMaterias: any[] = [];
    blocos.forEach((bloco, blocoIndex) => {
      const materias = getMateriasList(bloco);
      materias.forEach(materia => {
        allMaterias.push({
          ...materia,
          bloco_id: bloco.id,
          bloco_nome: bloco.nome,
          bloco_ordem: bloco.ordem || blocoIndex + 1
        });
      });
    });
    setMateriasData(allMaterias);
  }, [snapshot]);

  const getMateriasList = (bloco: any) => {
    if (bloco.materias && Array.isArray(bloco.materias)) {
      return bloco.materias;
    }
    if (bloco.items && Array.isArray(bloco.items)) {
      return bloco.items;
    }
    return [];
  };

  const getCurrentMateriaData = (materiaId: string) => {
    return materiasData.find(m => m.id === materiaId);
  };

  const handleEditMateria = (materia: any, blocoId: string, blocoNome: string, blocoOrdem: number) => {
    if (!materia || !materia.id) {
      return;
    }

    const currentData = getCurrentMateriaData(materia.id) || materia;
    
    setEditingMateria(materia.id);
    setEditData({
      id: materia.id,
      retranca: currentData.retranca || '',
      clip: currentData.clip || '',
      duracao: currentData.duracao || 0,
      texto: currentData.texto || '',
      cabeca: currentData.cabeca || '',
      gc: currentData.gc || '',
      status: currentData.status || 'draft',
      pagina: currentData.pagina || '',
      reporter: currentData.reporter || '',
      ordem: currentData.ordem || 0,
      tags: currentData.tags || [],
      local_gravacao: currentData.local_gravacao || '',
      equipamento: currentData.equipamento || '',
      bloco_id: blocoId,
      bloco_nome: blocoNome,
      bloco_ordem: blocoOrdem,
      tipo_material: currentData.tipo_material || '',
      tempo_clip: currentData.tempo_clip || ''
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
      
      // Determina se é de snapshot baseado na ausência de bloco_id válido
      const isFromSnapshot = !editData.bloco_id || editData.bloco_id === '';
      
      const updatedMateria = await updateMateriaHybrid(
        editData,
        isFromSnapshot,
        snapshot.id
      );
      
      console.log("Matéria atualizada com sucesso:", updatedMateria);

      // Update local state to reflect changes immediately
      setMateriasData(prevMaterias => 
        prevMaterias.map(materia => 
          materia.id === editData.id 
            ? { ...materia, ...editData }
            : materia
        )
      );

      setEditingMateria(null);
      setEditData(null);
    } catch (error: any) {
      console.error("Erro ao salvar matéria:", error);
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
    const currentData = getCurrentMateriaData(materia.id) || materia;
    
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
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-lg">{currentData.retranca}</h4>
            <div className="flex items-center space-x-2 mt-1">
              {currentData.pagina && (
                <Badge variant="outline" className="text-xs">
                  Pág. {currentData.pagina}
                </Badge>
              )}
              <Badge className={`text-xs ${getStatusClass(currentData.status || 'draft')}`}>
                {currentData.status || 'draft'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(currentData.duracao || 0)}
              </span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleEditMateria(materia, blocoId, blocoNome, blocoOrdem)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {currentData.clip && (
            <div>
              <span className="font-medium">Clip: </span>
              <span className="font-mono">{currentData.clip}</span>
            </div>
          )}
          {currentData.reporter && (
            <div>
              <span className="font-medium">Repórter: </span>
              <span>{currentData.reporter}</span>
            </div>
          )}
          {currentData.local_gravacao && (
            <div>
              <span className="font-medium">Local: </span>
              <span>{currentData.local_gravacao}</span>
            </div>
          )}
          {currentData.equipamento && (
            <div>
              <span className="font-medium">Equipamento: </span>
              <span>{currentData.equipamento}</span>
            </div>
          )}
        </div>

        {currentData.cabeca && (
          <div className="mt-3">
            <span className="font-medium text-sm">Cabeça:</span>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{currentData.cabeca}</p>
          </div>
        )}

        {currentData.texto && (
          <div className="mt-3">
            <span className="font-medium text-sm">Texto:</span>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{currentData.texto}</p>
          </div>
        )}

        {currentData.gc && (
          <div className="mt-3">
            <span className="font-medium text-sm">GC:</span>
            <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{currentData.gc}</p>
          </div>
        )}

        {currentData.tags && currentData.tags.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-sm">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {currentData.tags.map((tag: string, tagIndex: number) => (
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
      </div>

      {/* Blocos */}
      <div className="space-y-6">
        {blocos.map((bloco, blocoIndex) => {
          const materias = getMateriasList(bloco);
          const totalDuracao = materias.reduce((sum: number, item: any) => sum + (item.duracao || 0), 0);

          return (
            <Card key={bloco.id || `bloco-${blocoIndex}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{bloco.nome}</CardTitle>
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
