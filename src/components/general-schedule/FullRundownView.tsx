import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useClipboard } from "@/hooks/useClipboard";
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

  const { copyMateria, copiedBlock, clearClipboard, getClipboardInfo } = useClipboard();

  // Hook para colar blocos - simulando um espelho aberto temporário para permitir paste
  const { pasteBlock } = usePasteBlock({
    selectedJournal: null, // No histórico não há journal selecionado
    currentTelejornal: { espelho_aberto: false }, // Espelho fechado no histórico
    copiedBlock,
    clearClipboard,
    refreshBlocks: () => {
      // Não faz nada no histórico, apenas para compatibilidade
      console.log('Refresh blocks chamado no histórico (sem efeito)');
    }
  });

  // Enhanced keyboard shortcuts with timestamp-based priority
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: () => {
      if (selectedMateria) {
        console.log('Copying via Ctrl+C in history with timestamp priority:', selectedMateria);
        copyMateria(selectedMateria);
      }
    },
    onPaste: () => {
      console.log('Paste attempt in history (not allowed)');
      // Don't allow pasting in history, only copying
    },
    isEspelhoOpen: true, // Allow copy in history
    copiedBlock,
    onPasteBlock: () => {
      console.log('Block paste attempt in history (not allowed)');
      // Don't allow pasting blocks in history
    },
    getClipboardInfo
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
