
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUnifiedClipboard } from "@/hooks/useUnifiedClipboard";
import { usePasteToGeneralSchedule } from "@/hooks/paste-general-schedule";
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

  const { copiedMateria, copiedBlock, copyMateria, clearClipboard, getSourceInfo } = useUnifiedClipboard();

  // Hook para colar do Espelho Geral para espelhos abertos
  const { pasteMateria: pasteToActiveSchedule, pasteBlock: pasteBlockToActiveSchedule } = usePasteToGeneralSchedule({
    selectedJournal: null, // Será configurado dinamicamente quando necessário
    currentTelejornal: null, // Será configurado dinamicamente quando necessário
    copiedMateria,
    copiedBlock,
    clearClipboard,
    refreshBlocks: () => {
      console.log('Refresh blocks após paste do Espelho Geral');
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
    }
  });

  // Atalhos de teclado aprimorados para o Espelho Geral
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: () => {
      if (selectedMateria) {
        console.log('Copiando via Ctrl+C no Espelho Geral:', selectedMateria);
        // Copiar com contexto do Espelho Geral
        copyMateria(
          selectedMateria, 
          'general_schedule',
          snapshot.nome_telejornal || 'Telejornal',
          'Espelho Geral'
        );
      }
    },
    onPaste: () => {
      const sourceInfo = getSourceInfo();
      if (sourceInfo?.context === 'news_schedule') {
        console.log('Colando do espelho aberto para Espelho Geral (não permitido)');
        toast({
          title: "Operação não permitida",
          description: "Não é possível colar no Espelho Geral. Use esta matéria em um espelho aberto.",
          variant: "destructive"
        });
      } else {
        console.log('Tentativa de colar dentro do próprio Espelho Geral (não permitido)');
      }
    },
    isEspelhoOpen: true, // Permitir copy no Espelho Geral
    copiedBlock,
    onPasteBlock: () => {
      const sourceInfo = getSourceInfo();
      if (sourceInfo?.context === 'news_schedule') {
        console.log('Colando bloco do espelho aberto para Espelho Geral (não permitido)');
        toast({
          title: "Operação não permitida", 
          description: "Não é possível colar blocos no Espelho Geral. Use este bloco em um espelho aberto.",
          variant: "destructive"
        });
      } else {
        console.log('Tentativa de colar bloco dentro do próprio Espelho Geral (não permitido)');
      }
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
