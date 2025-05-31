
import { useEffect } from "react";
import { Bloco, Materia } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleEffectsProps {
  blocks: BlockWithItems[];
  setTotalJournalTime: (time: number) => void;
  updateTeleprompterData: (blocks: BlockWithItems[]) => void;
}

export const useNewsScheduleEffects = ({
  blocks,
  setTotalJournalTime,
  updateTeleprompterData
}: UseNewsScheduleEffectsProps) => {
  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks, setTotalJournalTime]);

  // Update teleprompter data when blocks change
  useEffect(() => {
    console.log("Blocks changed, updating teleprompter:", blocks);
    updateTeleprompterData(blocks);
  }, [blocks, updateTeleprompterData]);
};
