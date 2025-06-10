
import { useState } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { useToast } from "@/hooks/use-toast";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  blocks: BlockWithItems[];
  onRenumberItems: () => void;
  onAddBlock: () => void;
  onViewTeleprompter: () => void;
  onSaveModel: () => void;
  onViewSavedModels: () => void;
}

export const NewsScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  blocks,
  onRenumberItems,
  onAddBlock,
  onViewTeleprompter,
  onSaveModel,
  onViewSavedModels
}: NewsScheduleHeaderProps) => {
  const { toast } = useToast();

  const handleSaveModel = () => {
    if (!currentTelejornal) {
      toast({
        title: "Erro",
        description: "Nenhum telejornal selecionado",
        variant: "destructive"
      });
      return;
    }

    if (!blocks || blocks.length === 0) {
      toast({
        title: "Nenhuma estrutura para salvar",
        description: "Adicione blocos e matérias antes de salvar como modelo",
        variant: "destructive"
      });
      return;
    }

    onSaveModel();
  };

  return (
    <ScheduleHeader
      currentTelejornal={currentTelejornal}
      totalJournalTime={totalJournalTime}
      onRenumberItems={onRenumberItems}
      hasBlocks={blocks.length > 0}
      onAddBlock={onAddBlock}
      onViewTeleprompter={onViewTeleprompter}
      onSaveModel={handleSaveModel}
      onViewSavedModels={onViewSavedModels}
      blocks={blocks}
    />
  );
};
