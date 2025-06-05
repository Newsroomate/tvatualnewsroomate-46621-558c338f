
import { Materia } from "@/types";
import { useMateriaLock } from "@/hooks/useMateriaLock";
import { EditPanelLockScreen } from "./edit-panel/EditPanelLockScreen";
import { EditPanelProvider } from "./edit-panel/EditPanelProvider";

interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: Materia | null;
}

export const EditPanel = ({ isOpen, onClose, item }: EditPanelProps) => {
  // Hook para gerenciar o lock da matéria
  const { isLocked, isOwnLock } = useMateriaLock({
    materiaId: item?.id || null,
    isOpen,
    onClose
  });

  if (!isOpen || !item) return null;

  // Mostrar aviso se a matéria estiver bloqueada por outro usuário
  if (isLocked && !isOwnLock) {
    return <EditPanelLockScreen item={item} onClose={onClose} />;
  }

  return <EditPanelProvider item={item} onClose={onClose} />;
};
