
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Copy, Check, X } from "lucide-react";
import { EditableMateria } from "./types";

interface MaterialCardProps {
  materia: any;
  isEditing: boolean;
  editData: EditableMateria | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy: () => void;
  onSelect: () => void;
  onUpdateEditData: (updates: Partial<EditableMateria>) => void;
  isSelected: boolean;
  isSaving: boolean;
}

export const MaterialCard = ({
  materia,
  isEditing,
  editData,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onSelect,
  onUpdateEditData,
  isSelected,
  isSaving
}: MaterialCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isEditing && editData) {
    return (
      <Card className={`border-l-4 border-l-orange-500 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-3 space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              value={editData.retranca}
              onChange={(e) => onUpdateEditData({ retranca: e.target.value })}
              className="w-full text-sm font-medium border rounded px-2 py-1"
              placeholder="Retranca"
            />
            
            <input
              type="text"
              value={editData.clip || ''}
              onChange={(e) => onUpdateEditData({ clip: e.target.value })}
              className="w-full text-xs font-mono border rounded px-2 py-1"
              placeholder="Clip"
            />
            
            <textarea
              value={editData.cabeca || ''}
              onChange={(e) => onUpdateEditData({ cabeca: e.target.value })}
              className="w-full text-xs border rounded px-2 py-1 resize-none"
              rows={2}
              placeholder="Cabeça"
            />
            
            <textarea
              value={editData.gc || ''}
              onChange={(e) => onUpdateEditData({ gc: e.target.value })}
              className="w-full text-xs border rounded px-2 py-1 resize-none"
              rows={2}
              placeholder="GC (Gerador de Caracteres)"
            />
            
            <textarea
              value={editData.texto || ''}
              onChange={(e) => onUpdateEditData({ texto: e.target.value })}
              className="w-full text-xs border rounded px-2 py-1 resize-none"
              rows={4}
              placeholder="Texto da matéria"
            />
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={editData.reporter || ''}
                onChange={(e) => onUpdateEditData({ reporter: e.target.value })}
                className="flex-1 text-xs border rounded px-2 py-1"
                placeholder="Repórter"
              />
              <input
                type="text"
                value={editData.pagina || ''}
                onChange={(e) => onUpdateEditData({ pagina: e.target.value })}
                className="w-16 text-xs border rounded px-2 py-1"
                placeholder="Pág."
              />
            </div>
            
            <div className="flex justify-between items-center">
              <input
                type="number"
                value={editData.duracao}
                onChange={(e) => onUpdateEditData({ duracao: parseInt(e.target.value) || 0 })}
                className="w-20 text-xs border rounded px-2 py-1"
                placeholder="Duração"
              />
              
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || !editData.retranca?.trim()}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm">{materia.retranca}</h4>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-6 w-6 p-0"
                title="Editar matéria"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="h-6 w-6 p-0"
                title="Copiar matéria"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {materia.clip && (
            <p className="text-xs font-mono text-muted-foreground">
              Clip: {materia.clip}
            </p>
          )}
          
          {materia.cabeca && (
            <div className="bg-blue-50 p-2 rounded text-xs">
              <strong>Cabeça:</strong> {materia.cabeca}
            </div>
          )}
          
          {materia.gc && (
            <div className="bg-green-50 p-2 rounded text-xs">
              <strong>GC:</strong> {materia.gc}
            </div>
          )}
          
          {materia.texto && (
            <div className="bg-gray-50 p-2 rounded text-xs max-h-24 overflow-y-auto">
              <strong>Texto:</strong> {materia.texto}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              {materia.pagina && <span>Pág. {materia.pagina}</span>}
              {materia.reporter && <span>• {materia.reporter}</span>}
              {materia.duracao && <span>• {Math.floor(materia.duracao / 60)}:{(materia.duracao % 60).toString().padStart(2, '0')}</span>}
            </div>
            {materia.status && (
              <Badge variant="outline" className={`text-xs ${getStatusColor(materia.status)}`}>
                {materia.status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
