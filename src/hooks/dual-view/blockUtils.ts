
import { Materia } from "@/types";
import { parseClipTime } from "@/components/news-schedule/utils";

export const calculateBlockTotalTime = (items: Materia[]) => {
  return items.reduce((sum, item) => {
    const materiaDuration = item.duracao || 0;
    const clipDuration = parseClipTime(item.tempo_clip || '');
    return sum + materiaDuration + clipDuration;
  }, 0);
};

export const processUpdatedMateria = (updatedMateria: Materia): Materia => {
  return {
    ...updatedMateria,
    titulo: updatedMateria.retranca || "Sem título"
  };
};
