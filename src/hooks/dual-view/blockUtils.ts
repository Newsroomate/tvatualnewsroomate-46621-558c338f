
import { Materia } from "@/types";

export const calculateBlockTotalTime = (items: Materia[]) => {
  return items.reduce((sum, item) => sum + (item.duracao || 0), 0);
};

export const processUpdatedMateria = (updatedMateria: Materia): Materia => {
  return {
    ...updatedMateria,
    titulo: updatedMateria.retranca || "Sem título"
  };
};
