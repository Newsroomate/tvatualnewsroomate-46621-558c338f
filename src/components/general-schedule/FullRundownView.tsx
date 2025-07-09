
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useClipboard } from "@/hooks/useClipboard";
import { usePasteBlock } from "@/hooks/paste-block";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
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

  // Hook para colar blocos - não permitir no histórico
  const { pasteBlock } = usePasteBlock({
    selectedJournal: null,
    currentTelejornal: { espelho_aberto: false },
    copiedBlock,
    clearClipboard,
    refreshBlocks: () => {
      console.log('🚫 Refresh blocks chamado no histórico (sem efeito)');
    }
  });

  // Atalhos de teclado com nova lógica de clipboard
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: () => {
      if (selectedMateria) {
        console.log('📋 Copiando via Ctrl+C no histórico:', selectedMateria.retranca);
        copyMateria(selectedMateria);
      }
    },
    onPaste: () => {
      const clipboardInfo = getClipboardInfo ? getClipboardInfo() : null;
      console.log('🚫 Tentativa de colar no histórico (não permitido)', clipboardInfo);
      
      if (clipboardInfo?.type === 'block') {
        toast({
          title: "Paste não permitido no histórico",
          description: "Vá para um espelho aberto para colar o bloco copiado",
          variant: "destructive"
        });
      } else if (clipboardInfo?.type === 'materia') {
        toast({
          title: "Paste não permitido no histórico", 
          description: "Vá para um espelho aberto para colar a matéria copiada",
          variant: "destructive"
        });
      }
    },
    isEspelhoOpen: true, // Permitir copy no histórico
    copiedBlock,
    onPasteBlock: () => {
      console.log('🚫 Tentativa de colar bloco no histórico (não permitido)');
      toast({
        title: "Paste não permitido no histórico",
        description: "Vá para um espelho aberto para colar o bloco",
        variant: "destructive"
      });
    },
    getClipboardInfo // Passar função para obter info do clipboard
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
