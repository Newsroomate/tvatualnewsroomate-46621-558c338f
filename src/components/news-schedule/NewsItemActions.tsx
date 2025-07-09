
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { Materia } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { canDeleteMaterias } from "@/utils/permission-checker";

interface NewsItemActionsProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  onDuplicate: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModify?: boolean;
}

export const NewsItemActions = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  isEspelhoOpen,
  canModify = true
}: NewsItemActionsProps) => {
  const { profile } = useAuth();
  const canDelete = canDeleteMaterias(profile);

  return (
    <div className="flex space-x-1">
      {isEspelhoOpen && canModify && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-7 w-7 p-0"
            title="Editar matéria"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(item)}
            className="h-7 w-7 p-0"
            title="Duplicar matéria"
          >
            <Copy className="h-3 w-3" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
              title="Excluir matéria"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};
