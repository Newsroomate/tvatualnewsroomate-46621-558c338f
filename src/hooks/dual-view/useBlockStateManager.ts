
import { useState } from "react";
import { Materia, Bloco } from "@/types";
import { calculateBlockTotalTime, processUpdatedMateria } from "./blockUtils";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

export const useBlockStateManager = () => {
  const [primaryBlocks, setPrimaryBlocks] = useState<BlockWithItems[]>([]);
  const [secondaryBlocks, setSecondaryBlocks] = useState<BlockWithItems[]>([]);

  const updateBlocks = (
    setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
    updatedMateria: Materia,
    sourcePrefix: string
  ) => {
    console.log(`[${sourcePrefix}] Processing materia update:`, updatedMateria.id);
    
    setBlocks(currentBlocks => {
      return currentBlocks.map(block => {
        if (block.id === updatedMateria.bloco_id) {
          const itemExists = block.items.some(item => item.id === updatedMateria.id);
          
          let updatedItems;
          if (itemExists) {
            updatedItems = block.items.map(item => 
              item.id === updatedMateria.id 
                ? processUpdatedMateria(updatedMateria)
                : item
            );
          } else {
            updatedItems = [...block.items, processUpdatedMateria(updatedMateria)];
          }
          
          const totalTime = calculateBlockTotalTime(updatedItems);
          
          return {
            ...block,
            items: updatedItems,
            totalTime
          };
        }
        return block;
      });
    });
  };

  const removeMateria = (
    setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
    materiaId: string,
    sourcePrefix: string
  ) => {
    console.log(`[${sourcePrefix}] Removing materia:`, materiaId);
    
    setBlocks(currentBlocks => 
      currentBlocks.map(block => {
        const materiaIndex = block.items.findIndex(item => item.id === materiaId);
        
        if (materiaIndex !== -1) {
          const updatedItems = block.items.filter(item => item.id !== materiaId);
          const totalTime = calculateBlockTotalTime(updatedItems);
          
          return {
            ...block,
            items: updatedItems,
            totalTime
          };
        }
        
        return block;
      })
    );
  };

  return {
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    updateBlocks,
    removeMateria
  };
};
