
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Copy, CheckCircle } from "lucide-react";
import { formatTime } from "../../news-schedule/utils";
import { Materia } from "@/types";

interface MateriaViewCardProps {
  materia: any;
  blocoId: string;
  blocoNome: string;
  blocoOrdem: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onCopy: () => void;
}

const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const MateriaViewCard = ({
  materia,
  blocoId,
  blocoNome,
  blocoOrdem,
  isSelected,
  onSelect,
  onEdit,
  onCopy
}: MateriaViewCardProps) => {
  return (
    <div 
      className={`cursor-pointer p-2 rounded transition-colors ${
        isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
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
              onCopy();
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
              onEdit();
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
