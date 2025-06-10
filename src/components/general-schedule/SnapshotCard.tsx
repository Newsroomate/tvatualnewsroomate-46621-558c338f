
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { formatTime } from "../news-schedule/utils";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { BlockCard } from "./BlockCard";

interface SnapshotCardProps {
  snapshot: ClosedRundownSnapshot;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onViewDetails: (snapshot: ClosedRundownSnapshot) => void;
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

export const SnapshotCard = ({ snapshot, isExpanded, onToggleExpansion, onViewDetails }: SnapshotCardProps) => {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  
  const toggleBlockExpansion = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const blocos = snapshot.estrutura_completa.blocos || [];
  
  const totalMaterias = blocos.reduce((sum, bloco) => {
    const materias = getMateriasList(bloco);
    return sum + materias.length;
  }, 0);

  const totalDuracao = blocos.reduce((sum, bloco) => {
    const materias = getMateriasList(bloco);
    return sum + materias.reduce((blockSum: number, item: any) => blockSum + (item.duracao || 0), 0);
  }, 0);

  console.log(`Snapshot ${snapshot.id}:`, {
    blocos: blocos.length,
    totalMaterias,
    totalDuracao,
    estrutura: snapshot.estrutura_completa
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpansion}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <CardTitle className="text-base">
              {snapshot.nome_telejornal}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {format(new Date(snapshot.data_referencia), "dd/MM/yyyy")}
            </Badge>
            {snapshot.horario && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {snapshot.horario}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{blocos.length} blocos</span>
              <span>•</span>
              <span>{totalMaterias} matérias</span>
              <span>•</span>
              <span>{formatTime(totalDuracao)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(snapshot)}
              className="flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Detalhes</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {blocos.map((bloco, blocoIndex) => {
              const isBlockExpanded = expandedBlocks.has(bloco.id || `bloco-${blocoIndex}`);
              
              return (
                <BlockCard
                  key={bloco.id || `bloco-${blocoIndex}`}
                  bloco={bloco}
                  blocoIndex={blocoIndex}
                  isExpanded={isBlockExpanded}
                  onToggleExpansion={() => toggleBlockExpansion(bloco.id || `bloco-${blocoIndex}`)}
                />
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
