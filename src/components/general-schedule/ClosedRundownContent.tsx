
import { useState } from "react";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { SnapshotCard } from "./SnapshotCard";

interface ClosedRundownContentProps {
  snapshots: ClosedRundownSnapshot[];
  isLoading: boolean;
}

export const ClosedRundownContent = ({ snapshots, isLoading }: ClosedRundownContentProps) => {
  const [expandedSnapshots, setExpandedSnapshots] = useState<Set<string>>(new Set());

  const toggleSnapshotExpansion = (snapshotId: string) => {
    const newExpanded = new Set(expandedSnapshots);
    if (newExpanded.has(snapshotId)) {
      newExpanded.delete(snapshotId);
    } else {
      newExpanded.add(snapshotId);
    }
    setExpandedSnapshots(newExpanded);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum espelho encontrado</h3>
        <p className="text-gray-500 mb-4">
          Não há espelhos fechados com os filtros selecionados.
        </p>
        <p className="text-sm text-gray-400">
          Dica: Remova alguns filtros para ver mais resultados ou aguarde o fechamento automático de espelhos na virada do dia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">
          Espelhos Fechados ({snapshots.length})
        </h3>
        <div className="text-sm text-muted-foreground">
          Incluindo espelhos fechados automaticamente na virada do dia
        </div>
      </div>
      
      {snapshots.map((snapshot) => {
        const isExpanded = expandedSnapshots.has(snapshot.id);
        
        return (
          <SnapshotCard
            key={snapshot.id}
            snapshot={snapshot}
            isExpanded={isExpanded}
            onToggleExpansion={() => toggleSnapshotExpansion(snapshot.id)}
          />
        );
      })}
    </div>
  );
};
