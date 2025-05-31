
import { Bloco, Materia } from "@/types";

export type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

export interface CrossPanelDragResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}

export interface UseCrossPanelDragAndDropProps {
  primaryBlocks: BlockWithItems[];
  secondaryBlocks: BlockWithItems[];
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  primaryTelejornal: any;
  secondaryTelejornal: any;
}
