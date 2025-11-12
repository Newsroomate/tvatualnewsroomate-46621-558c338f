
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, FileText, Copy, CheckCircle2 } from "lucide-react";
import { formatTime } from "../news-schedule/utils";

interface MaterialCardProps {
  materia: any;
  materiaIndex: number;
  onCopyMateria?: (materia: any) => void;
  onSelectMateria?: (materia: any) => void;
  isSelected?: boolean;
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

export const MaterialCard = ({ 
  materia, 
  materiaIndex, 
  onCopyMateria, 
  onSelectMateria,
  isSelected = false 
}: MaterialCardProps) => {
  const handleClick = () => {
    if (onSelectMateria) {
      onSelectMateria(materia);
    }
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopyMateria) {
      onCopyMateria(materia);
    }
  };

  // Contador de campos preenchidos para mostrar completude da matéria
  const camposPreenchidos = [
    materia.retranca,
    materia.texto,
    materia.clip,
    materia.reporter,
    materia.pagina,
    materia.cabeca,
    materia.gc,
    materia.tipo_material,
    materia.local_gravacao,
    materia.tempo_clip
  ].filter(campo => campo && campo.toString().trim() !== '').length;

  return (
    <div 
      className={`bg-white border rounded p-3 text-sm cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary bg-blue-50 border-blue-300 shadow-sm' 
          : 'hover:bg-gray-50 hover:border-gray-300'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {isSelected && (
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            )}
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
            {/* Indicador de completude dos campos */}
            <Badge variant="outline" className="text-xs" title={`${camposPreenchidos} campos preenchidos`}>
              {camposPreenchidos} campos
            </Badge>
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
            {materia.tipo_material && (
              <Badge variant="outline" className="text-xs">
                {materia.tipo_material}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Botão de cópia melhorado */}
        {onCopyMateria && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyClick}
            className={`h-7 w-7 p-0 transition-colors ${
              isSelected 
                ? 'hover:bg-blue-200 text-blue-700' 
                : 'hover:bg-blue-100 text-blue-600'
            }`}
            title={`Copiar matéria com ${camposPreenchidos} campos preservados`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
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

      {/* Indicadores adicionais para campos preenchidos */}
      {(materia.local_gravacao || materia.tempo_clip) && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            {materia.local_gravacao && (
              <Badge variant="outline" className="text-xs">Local: {materia.local_gravacao}</Badge>
            )}
            {materia.tempo_clip && (
              <Badge variant="outline" className="text-xs">Tempo: {materia.tempo_clip}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
