
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { formatTime } from "../news-schedule/utils";
import { MaterialCard } from "./MaterialCard";
import { useClipboard } from "@/context/clipboard";

interface BlockCardProps {
  bloco: any;
  blocoIndex: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onCopyMateria?: (materia: any) => void;
  onSelectMateria?: (materia: any) => void;
  isSelected?: (materiaId: string) => boolean;
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

export const BlockCard = ({ 
  bloco, 
  blocoIndex, 
  isExpanded, 
  onToggleExpansion,
  onCopyMateria,
  onSelectMateria,
  isSelected
}: BlockCardProps) => {
  const materias = getMateriasList(bloco);
  const blocoDuracao = materias.reduce((sum: number, item: any) => sum + (item.duracao || 0), 0);
  const { copyBlock } = useClipboard();

  console.log(`Bloco ${bloco.nome}:`, {
    materias: materias.length,
    blocoDuracao,
    rawBloco: bloco
  });

  const handleCopyBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Copiando bloco completo:', bloco.nome);
    copyBlock(bloco, materias);
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpansion}
            className="p-1 h-5 w-5"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
          <h4 className="font-medium text-sm">{bloco.nome}</h4>
          <Badge variant="outline" className="text-xs">
            Bloco {bloco.ordem}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-muted-foreground">
            {materias.length} matérias • {formatTime(blocoDuracao)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyBlock}
            className="p-1 h-7 w-7 hover:bg-gray-200"
            title="Copiar bloco completo"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 ml-6">
          {materias.length > 0 ? (
            materias.map((materia: any, materiaIndex: number) => (
              <MaterialCard
                key={materia.id || `materia-${materiaIndex}`}
                materia={materia}
                materiaIndex={materiaIndex}
                onCopyMateria={onCopyMateria}
                onSelectMateria={onSelectMateria}
                isSelected={isSelected ? isSelected(materia.id) : false}
              />
            ))
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Nenhuma matéria encontrada neste bloco
            </div>
          )}
        </div>
      )}
    </div>
  );
};
