
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MateriaEditForm } from "./MateriaEditForm";
import { MateriaViewCard } from "./MateriaViewCard";
import { formatTime } from "../news-schedule/utils";

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

interface RundownBlockProps {
  bloco: any;
  blocoIndex: number;
  editingMateria: string | null;
  editData: EditableMateria | null;
  onEditMateria: (materia: any) => void;
  onSaveMateria: () => void;
  onCancelEdit: () => void;
  onEditDataChange: (data: EditableMateria) => void;
  isSaving: boolean;
}

export const RundownBlock = ({
  bloco,
  blocoIndex,
  editingMateria,
  editData,
  onEditMateria,
  onSaveMateria,
  onCancelEdit,
  onEditDataChange,
  isSaving
}: RundownBlockProps) => {
  const getMateriasList = (bloco: any) => {
    if (bloco.materias && Array.isArray(bloco.materias)) {
      return bloco.materias;
    }
    if (bloco.items && Array.isArray(bloco.items)) {
      return bloco.items;
    }
    return [];
  };

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
              {editingMateria === materia.id && editData ? (
                <MateriaEditForm
                  editData={editData}
                  onSave={onSaveMateria}
                  onCancel={onCancelEdit}
                  onChange={onEditDataChange}
                  isSaving={isSaving}
                />
              ) : (
                <MateriaViewCard
                  materia={materia}
                  onEdit={onEditMateria}
                />
              )}
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
};
