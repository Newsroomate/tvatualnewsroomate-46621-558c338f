
import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { SnapshotCard } from "./SnapshotCard";
import { FullRundownView } from "./FullRundownView";

interface ClosedRundownContentProps {
  snapshots: ClosedRundownSnapshot[];
  isLoading: boolean;
}

export const ClosedRundownContent = ({ snapshots, isLoading }: ClosedRundownContentProps) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<ClosedRundownSnapshot | null>(null);

  if (isLoading) {
    return <LoadingState />;
  }

  if (selectedSnapshot) {
    return (
      <FullRundownView 
        snapshot={selectedSnapshot}
        onBack={() => setSelectedSnapshot(null)}
      />
    );
  }

  if (snapshots.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Informações sobre o sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Como funciona o sistema de espelhos</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Fechamento Manual:</strong> Quando você clica em "Fechar Espelho", o sistema salva automaticamente uma cópia completa de todas as matérias e blocos.</p>
              <p>• <strong>Histórico Completo:</strong> Todos os espelhos fechados ficam disponíveis neste histórico para consulta futura.</p>
              <p>• <strong>Visualização Detalhada:</strong> Clique em qualquer espelho para ver todos os detalhes, incluindo textos, cabeças e informações técnicas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de espelhos */}
      <div className="grid gap-4">
        {snapshots.map((snapshot, index) => (
          <SnapshotCard 
            key={snapshot.id}
            snapshot={snapshot}
            onView={() => setSelectedSnapshot(snapshot)}
          />
        ))}
      </div>

      {snapshots.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-6">
          {snapshots.length} espelho{snapshots.length !== 1 ? 's' : ''} encontrado{snapshots.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
