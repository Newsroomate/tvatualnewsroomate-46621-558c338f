
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useClipboard } from "@/hooks/useClipboard";
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

  const { copyMateria, copyBloco } = useClipboard();

  const handleCopyBloco = (blocoData: any) => {
    console.log('Copiando bloco do histórico:', blocoData);
    copyBloco(blocoData);
  };

  // Atalhos de teclado para copiar - com funcionalidade aprimorada
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: () => {
      if (selectedMateria) {
        console.log('Copiando via Ctrl+C no histórico:', selectedMateria);
        copyMateria(selectedMateria);
      }
    },
    onPaste: () => {
      console.log('Tentativa de colar no histórico (não permitido)');
      // Não permitir colar no histórico, apenas copiar
    },
    isEspelhoOpen: true
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
            onCopyBloco={handleCopyBloco}
            isSelected={isSelected}
          />
        ))}

        {blocos.length === 0 && <EmptyBlocosState />}
      </div>
    </div>
  );
};
