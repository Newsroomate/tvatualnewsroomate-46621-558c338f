
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Clock, Eye, AlertTriangle } from "lucide-react";
import { formatTime } from "../news-schedule/utils";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { Telejornal } from "@/types";
import { BlockCard } from "./BlockCard";
import { formatDate, DATE_FORMATS } from "@/utils/date-utils";

interface SnapshotCardProps {
  snapshot: ClosedRundownSnapshot;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onViewDetails: (snapshot: ClosedRundownSnapshot) => void;
  telejornais: Telejornal[];
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

export const SnapshotCard = ({ snapshot, isExpanded, onToggleExpansion, onViewDetails, telejornais }: SnapshotCardProps) => {
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

  // Buscar o telejornal atual na lista de telejornais ativos
  const currentTelejornal = telejornais.find(tj => tj.id === snapshot.telejornal_id);
  const telejornalExists = !!currentTelejornal;
  
  // Usar o nome do telejornal atual se existir, senão usar o nome salvo no snapshot
  const displayTelejornalName = currentTelejornal?.nome || snapshot.nome_telejornal;
  
  console.log('SnapshotCard telejornal info:', {
    snapshot_id: snapshot.id,
    telejornal_id: snapshot.telejornal_id,
    found_telejornal: !!currentTelejornal,
    display_name: displayTelejornalName,
    available_telejornais: telejornais.map(tj => ({ id: tj.id, nome: tj.nome }))
  });
  
  // Garantir que a data seja exibida corretamente baseada na data_referencia
  const getValidDate = (dateRef: string) => {
    if (!dateRef) return new Date();
    
    try {
      // Tentar construir a data com formato ISO
      const date = new Date(dateRef + 'T00:00:00');
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Invalid date_referencia:', dateRef);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.warn('Error parsing date_referencia:', dateRef, error);
      return new Date();
    }
  };
  
  const displayDate = getValidDate(snapshot.data_referencia);

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
            <CardTitle className="text-base flex items-center gap-2">
              {displayTelejornalName}
              {!telejornalExists && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Telejornal Excluído
                </Badge>
              )}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {formatDate(snapshot.data_referencia, DATE_FORMATS.DATE_ONLY)}
            </Badge>
            {snapshot.horario && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {snapshot.horario}
              </Badge>
            )}
            <div className="flex items-center gap-2 ml-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Fechado: {formatDate(snapshot.created_at, DATE_FORMATS.DATE_TIME)}
              </span>
            </div>
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
