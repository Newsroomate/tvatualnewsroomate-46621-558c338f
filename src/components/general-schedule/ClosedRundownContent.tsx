
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { formatTime } from "../news-schedule/utils";
import { ChevronDown, ChevronRight, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";

interface ClosedRundownContentProps {
  snapshots: ClosedRundownSnapshot[];
  isLoading: boolean;
}

export const ClosedRundownContent = ({ snapshots, isLoading }: ClosedRundownContentProps) => {
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<string>>(new Set());
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const toggleSnapshotExpansion = (snapshotId: string) => {
    const newExpanded = new Set(expandedSnapshots);
    if (newExpanded.has(snapshotId)) {
      newExpanded.delete(snapshotId);
    } else {
      newExpanded.add(snapshotId);
    }
    setExpandedSnapshots(newExpanded);
  };

  const toggleBlockExpansion = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando espelhos fechados...</p>
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum espelho fechado encontrado com os filtros selecionados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Espelhos Fechados ({snapshots.length})</h3>
      
      {snapshots.map((snapshot) => {
        const isExpanded = expandedSnapshots.has(snapshot.id);
        const totalMaterias = snapshot.estrutura_completa.blocos.reduce(
          (sum, bloco) => sum + bloco.materias.length, 0
        );
        const totalDuracao = snapshot.estrutura_completa.blocos.reduce(
          (sum, bloco) => sum + bloco.materias.reduce((blockSum, materia) => blockSum + materia.duracao, 0), 0
        );

        return (
          <Card key={snapshot.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSnapshotExpansion(snapshot.id)}
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
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{snapshot.estrutura_completa.blocos.length} blocos</span>
                  <span>•</span>
                  <span>{totalMaterias} matérias</span>
                  <span>•</span>
                  <span>{formatTime(totalDuracao)}</span>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {snapshot.estrutura_completa.blocos.map((bloco) => {
                    const isBlockExpanded = expandedBlocks.has(bloco.id);
                    const blocoDuracao = bloco.materias.reduce((sum, materia) => sum + materia.duracao, 0);

                    return (
                      <div key={bloco.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBlockExpansion(bloco.id)}
                              className="p-1 h-5 w-5"
                            >
                              {isBlockExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </Button>
                            <h4 className="font-medium text-sm">{bloco.nome}</h4>
                            <Badge variant="outline" className="text-xs">
                              Bloco {bloco.ordem}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {bloco.materias.length} matérias • {formatTime(blocoDuracao)}
                          </div>
                        </div>

                        {isBlockExpanded && (
                          <div className="space-y-2 ml-6">
                            {bloco.materias.map((materia) => (
                              <div key={materia.id} className="bg-white border rounded p-3 text-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium">{materia.retranca}</span>
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
                                        {formatTime(materia.duracao)}
                                      </span>
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
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
