
import { useState } from "react";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";
import { FullRundownHeader } from "./FullRundownHeader";
import { RundownBlock } from "./RundownBlock";

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
}

export const FullRundownView = ({ snapshot, onBack }: FullRundownViewProps) => {
  const [editingMateria, setEditingMateria] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableMateria | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const blocos = snapshot.estrutura_completa.blocos || [];

  const handleEditMateria = (materia: any) => {
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
      equipamento: materia.equipamento || ''
    });
  };

  const handleSaveMateria = async () => {
    if (!editData) return;

    setIsSaving(true);
    try {
      await updateMateria(editData.id, {
        retranca: editData.retranca,
        clip: editData.clip,
        duracao: editData.duracao,
        texto: editData.texto,
        cabeca: editData.cabeca,
        gc: editData.gc,
        status: editData.status,
        pagina: editData.pagina,
        reporter: editData.reporter,
        tags: editData.tags,
        local_gravacao: editData.local_gravacao,
        tempo_clip: editData.clip
      });

      toast({
        title: "Matéria atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      setEditingMateria(null);
      setEditData(null);
    } catch (error) {
      console.error("Erro ao salvar matéria:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMateria(null);
    setEditData(null);
  };

  return (
    <div className="space-y-4">
      <FullRundownHeader snapshot={snapshot} onBack={onBack} />

      <div className="space-y-6">
        {blocos.map((bloco, blocoIndex) => (
          <RundownBlock
            key={bloco.id || `bloco-${blocoIndex}`}
            bloco={bloco}
            blocoIndex={blocoIndex}
            editingMateria={editingMateria}
            editData={editData}
            onEditMateria={handleEditMateria}
            onSaveMateria={handleSaveMateria}
            onCancelEdit={handleCancelEdit}
            onEditDataChange={setEditData}
            isSaving={isSaving}
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
