
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
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Espelhos Fechados ({snapshots.length})</h3>
      
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
