
import { Badge } from "@/components/ui/badge";
import { Clock, User, FileText } from "lucide-react";
import { formatTime } from "../news-schedule/utils";

interface MaterialCardProps {
  materia: any;
  materiaIndex: number;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const MaterialCard = ({ materia, materiaIndex }: MaterialCardProps) => {
  return (
    <div className="bg-white border rounded p-3 text-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium">{materia.retranca || materia.titulo || `Matéria ${materiaIndex + 1}`}</span>
            {materia.clip && (
              <Badge variant="secondary" className="text-xs font-mono">
                {materia.clip}
              </Badge>
            )}
            {materia.status && (
              <Badge className={`text-xs ${getStatusColor(materia.status)}`}>
                {materia.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {materia.pagina && <span>Pág. {materia.pagina}</span>}
            {materia.reporter && (
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {materia.reporter}
              </span>
            )}
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(materia.duracao || 0)}
            </span>
            {materia.ordem && <span>Ordem: {materia.ordem}</span>}
          </div>
        </div>
      </div>

      {materia.cabeca && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium text-blue-800 mb-1 flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            Cabeça:
          </div>
          <p className="text-blue-700">{materia.cabeca}</p>
        </div>
      )}

      {materia.texto && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <div className="font-medium text-gray-800 mb-1">Texto:</div>
          <p className="text-gray-700 line-clamp-3">{materia.texto}</p>
        </div>
      )}

      {materia.gc && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
          <div className="font-medium text-yellow-800 mb-1">GC:</div>
          <p className="text-yellow-700">{materia.gc}</p>
        </div>
      )}
    </div>
  );
};
