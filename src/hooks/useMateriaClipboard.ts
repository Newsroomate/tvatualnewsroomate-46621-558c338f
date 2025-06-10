
import { useEffect } from 'react';
import { Materia } from '@/types';
import { useClipboard } from '@/context/ClipboardContext';
import { createMateria } from '@/services/materias-api';
import { useToast } from '@/hooks/use-toast';

interface UseMateriaClipboardProps {
  selectedMaterias: Materia[];
  onPasteMaterias?: (materias: Partial<Materia>[], targetMateria?: Materia) => void;
  currentBlockId?: string;
  currentTelejornalId?: string;
  isEnabled?: boolean;
  selectedMateria?: Materia | null;
}

export const useMateriaClipboard = ({
  selectedMaterias,
  onPasteMaterias,
  currentBlockId,
  currentTelejornalId,
  isEnabled = true,
  selectedMateria
}: UseMateriaClipboardProps) => {
  const { copyMaterias, copiedMaterias } = useClipboard();
  const { toast } = useToast();

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      // Only handle if Ctrl (or Cmd on Mac) is pressed
      if (!(event.ctrlKey || event.metaKey)) return;

      if (event.key === 'c' && selectedMaterias.length > 0) {
        event.preventDefault();
        copyMaterias(selectedMaterias);
      }

      if (event.key === 'v' && copiedMaterias.length > 0 && currentBlockId && currentTelejornalId) {
        event.preventDefault();
        
        try {
          const materiasToCreate = copiedMaterias.map(materia => {
            // Create a copy of the materia without the ID and with new block assignment
            const { id, created_at, updated_at, ...materiaData } = materia;
            return {
              ...materiaData,
              bloco_id: currentBlockId,
              // Set ordem to be after the selected materia, or at the end
              ordem: selectedMateria ? selectedMateria.ordem + 1 : 999
            };
          });

          // If there's a callback for handling paste, use it
          if (onPasteMaterias) {
            onPasteMaterias(materiasToCreate, selectedMateria || undefined);
          } else {
            // Otherwise create the materias directly
            for (const materiaData of materiasToCreate) {
              const materiaToCreate = {
                ...materiaData,
                bloco_id: currentBlockId,
                retranca: materiaData.retranca || 'Nova Matéria',
                duracao: materiaData.duracao || 0,
                ordem: materiaData.ordem || 1,
                status: materiaData.status || 'draft'
              };
              
              await createMateria(materiaToCreate);
            }
            
            toast({
              title: "Matérias coladas",
              description: `${materiasToCreate.length} matéria(s) colada(s) com sucesso`,
            });
          }
        } catch (error) {
          console.error('Erro ao colar matérias:', error);
          toast({
            title: "Erro ao colar matérias",
            description: "Não foi possível colar as matérias selecionadas",
            variant: "destructive"
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMaterias, copiedMaterias, currentBlockId, currentTelejornalId, isEnabled, selectedMateria, copyMaterias, onPasteMaterias, toast]);

  return {
    copyMaterias,
    copiedMaterias,
    hasCopiedMaterias: copiedMaterias.length > 0
  };
};
