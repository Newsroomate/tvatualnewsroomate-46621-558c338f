
import { Materia, Bloco } from "@/types";

export type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

export interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
}
