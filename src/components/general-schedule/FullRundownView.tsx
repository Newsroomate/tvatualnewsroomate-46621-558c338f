
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useClipboard } from "@/context/clipboard";
import { usePasteBlock } from "@/hooks/paste-block";
import { useQueryClient } from "@tanstack/react-query";
import { FullRundownHeader } from "./full-rundown/FullRundownHeader";
import { BlocoCard } from "./full-rundown/BlocoCard";
import { InstructionSection } from "./full-rundown/InstructionSection";
import { EmptyBlocosState } from "./full-rundown/EmptyBlocosState";
import { LoadingState } from "./full-rundown/LoadingState";
import { useMateriaOperations } from "./hooks/useMateriaOperations";

interface FullRundownViewProps {
  snapshot: ClosedRundownSnapshot;
  onBack: () => void;
}

export const FullRundownView = ({ snapshot, onBack }: FullRundownViewProps) => {
  const queryClient = useQueryClient();
  const {
    blocos,
    isLoadingHybrid,
    hybridError,
    refreshData,
    editingMateria,
    editData,
    isSaving,
    selectedMateria,
    isSelected,
    handleCopyMateria,
    handleSelectMateria,
    handleEditMateria,
    handleSaveMateria,
    handleCancelEdit,
    handleUpdateEditData
  } = useMateriaOperations(snapshot);

  const { copyMateria } = useClipboard();

  // Hook para colar blocos - simulando um espelho aberto temporário para permitir paste
  const { pasteBlock } = usePasteBlock({
    selectedJournal: null, // No histórico não há journal selecionado
    currentTelejornal: { espelho_aberto: false }, // Espelho fechado no histórico
    refreshBlocks: () => {
      // Não faz nada no histórico, apenas para compatibilidade
      console.log('Refresh blocks chamado no histórico (sem efeito)');
    }
  });

  // Atalhos de teclado para copiar - com funcionalidade aprimorada
  useKeyboardShortcuts({
    selectedMateria,
    onPaste: () => {
      console.log('Tentativa de colar no histórico (não permitido)');
      // Não permitir colar no histórico, apenas copiar
    },
    isEspelhoOpen: true, // Permitir copy no histórico
    onPasteBlock: () => {
      console.log('Tentativa de colar bloco no histórico (não permitido)');
      // Não permitir colar blocos no histórico
    }
  });

  if (isLoadingHybrid) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      <FullRundownHeader
        snapshot={snapshot}
        onBack={onBack}
        onRefresh={refreshData}
        hybridError={hybridError}
      />

      <InstructionSection />

      {/* Blocos */}
      <div className="space-y-6">
        {blocos.map((bloco, blocoIndex) => (
          <BlocoCard
            key={bloco.id || `bloco-${blocoIndex}`}
            bloco={bloco}
            blocoIndex={blocoIndex}
            editingMateria={editingMateria}
            editData={editData}
            isSaving={isSaving}
            onEditMateria={handleEditMateria}
            onSaveMateria={handleSaveMateria}
            onCancelEdit={handleCancelEdit}
            onUpdateEditData={handleUpdateEditData}
            onSelectMateria={handleSelectMateria}
            onCopyMateria={handleCopyMateria}
            isSelected={isSelected}
          />
        ))}

        {blocos.length === 0 && <EmptyBlocosState />}
      </div>
    </div>
  );
};
