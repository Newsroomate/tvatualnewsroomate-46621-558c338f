
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatTime } from "../news-schedule/utils";
import { MaterialCard } from "./MaterialCard";

interface BlockCardProps {
  bloco: any;
  blocoIndex: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
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

export const BlockCard = ({ bloco, blocoIndex, isExpanded, onToggleExpansion }: BlockCardProps) => {
  const materias = getMateriasList(bloco);
  const blocoDuracao = materias.reduce((sum: number, item: any) => sum + (item.duracao || 0), 0);

  console.log(`Bloco ${bloco.nome}:`, {
    materias: materias.length,
    blocoDuracao,
    rawBloco: bloco
  });

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
        <div className="text-xs text-muted-foreground">
          {materias.length} matérias • {formatTime(blocoDuracao)}
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
