
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "../../news-schedule/utils";
import { MateriaViewCard } from "./MateriaViewCard";
import { EditableMateriaForm } from "./EditableMateriaForm";
import { EditableMateria } from "../types";

interface BlocoCardProps {
  bloco: any;
  blocoIndex: number;
  editingMateria: string | null;
  editData: EditableMateria | null;
  isSaving: boolean;
  onEditMateria: (materia: any, blocoId: string, blocoNome: string, blocoOrdem: number) => void;
  onSaveMateria: () => void;
  onCancelEdit: () => void;
  onUpdateEditData: (updates: Partial<EditableMateria>) => void;
  onSelectMateria: (materia: any, blocoId: string, blocoNome: string) => void;
  onCopyMateria: (materia: any, blocoId: string, blocoNome: string) => void;
  onCopyBloco?: (blocoData: any) => void;
  isSelected: (id: string) => boolean;
}

const getMateriasList = (bloco: any) => {
  if (bloco.materias && Array.isArray(bloco.materias)) {
    return bloco.materias;
  }
  if (bloco.items && Array.isArray(bloco.items)) {
    return bloco.items;
  }
  return [];
};

export const BlocoCard = ({
  bloco,
  blocoIndex,
  editingMateria,
  editData,
  isSaving,
  onEditMateria,
  onSaveMateria,
  onCancelEdit,
  onUpdateEditData,
  onSelectMateria,
  onCopyMateria,
  onCopyBloco,
  isSelected
}: BlocoCardProps) => {
  const materias = getMateriasList(bloco);
  const totalDuracao = materias.reduce((sum: number, item: any) => sum + (item.duracao || 0), 0);
  const editedCount = materias.filter((item: any) => item.isEdited).length;

  const handleCopyBloco = () => {
    if (onCopyBloco) {
      const blocoData = {
        id: bloco.id,
        nome: bloco.nome,
        ordem: bloco.ordem || blocoIndex + 1,
        materias: materias,
        totalTime: totalDuracao
      };
      onCopyBloco(blocoData);
    }
  };

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
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">
              {materias.length} matérias • {formatTime(totalDuracao)}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBloco}
                    className="p-2 hover:bg-blue-100"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Copiar bloco inteiro
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {materias.map((materia: any, materiaIndex: number) => (
            <div key={materia.id || `materia-${materiaIndex}`} className="border rounded-lg p-4">
              {editingMateria === materia.id && editData ? (
                <EditableMateriaForm
                  editData={editData}
                  isSaving={isSaving}
                  onSave={onSaveMateria}
                  onCancel={onCancelEdit}
                  onUpdate={onUpdateEditData}
                />
              ) : (
                <MateriaViewCard
                  materia={materia}
                  blocoId={bloco.id}
                  blocoNome={bloco.nome}
                  blocoOrdem={bloco.ordem || blocoIndex + 1}
                  isSelected={isSelected(materia.id)}
                  onSelect={() => onSelectMateria(materia, bloco.id, bloco.nome)}
                  onEdit={() => onEditMateria(materia, bloco.id, bloco.nome, bloco.ordem || blocoIndex + 1)}
                  onCopy={() => onCopyMateria(materia, bloco.id, bloco.nome)}
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
