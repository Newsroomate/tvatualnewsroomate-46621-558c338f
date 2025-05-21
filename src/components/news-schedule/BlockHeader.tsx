
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "./utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface BlockHeaderProps {
  blockName: string;
  totalTime: number;
  onAddItem: () => void;
  onRenameBlock?: (newName: string) => Promise<void>;
  onDeleteBlock?: () => Promise<void>;
  newItemBlock: string | null;
  blockId: string;
  isEspelhoOpen: boolean;
  canAddItem?: boolean;
}

export const BlockHeader = ({ 
  blockName, 
  totalTime, 
  onAddItem, 
  onRenameBlock,
  onDeleteBlock,
  newItemBlock, 
  blockId,
  isEspelhoOpen,
  canAddItem = true
}: BlockHeaderProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newBlockName, setNewBlockName] = useState(blockName);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRenameStart = () => {
    if (!isEspelhoOpen) return;
    setNewBlockName(blockName);
    setIsEditingName(true);
  };

  const handleRenameCancel = () => {
    setIsEditingName(false);
    setNewBlockName(blockName);
  };

  const handleRenameSave = async () => {
    if (newBlockName.trim() === "") {
      toast({
        title: "Nome inválido",
        description: "O nome do bloco não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    if (newBlockName === blockName) {
      setIsEditingName(false);
      return;
    }

    try {
      if (onRenameBlock) {
        await onRenameBlock(newBlockName);
        toast({
          title: "Bloco renomeado",
          description: `O bloco foi renomeado para "${newBlockName}"`,
        });
      }
      setIsEditingName(false);
    } catch (error) {
      console.error("Erro ao renomear bloco:", error);
      toast({
        title: "Erro ao renomear",
        description: "Não foi possível renomear o bloco",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRequest = () => {
    if (!isEspelhoOpen) return;
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (onDeleteBlock) {
        await onDeleteBlock();
        toast({
          title: "Bloco excluído",
          description: "O bloco e suas matérias foram removidos com sucesso",
        });
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir bloco:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o bloco",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="bg-muted p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <div className="flex items-center space-x-1">
              <Input
                type="text"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                autoFocus
                className="w-40 h-8 py-1"
              />
              <Button size="sm" variant="ghost" onClick={handleRenameSave}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRenameCancel}>
                Cancelar
              </Button>
            </div>
          ) : (
            <h2 className="font-bold">{blockName}</h2>
          )}

          {!isEditingName && isEspelhoOpen && onRenameBlock && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="p-1 h-7 w-7"
                    onClick={handleRenameStart}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Renomear bloco</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!isEditingName && isEspelhoOpen && onDeleteBlock && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="p-1 h-7 w-7 text-red-500 hover:text-red-700"
                    onClick={handleDeleteRequest}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir bloco</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            Tempo: {formatTime(totalTime)}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onAddItem}
                    disabled={(newItemBlock === blockId || !isEspelhoOpen || !canAddItem)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Nova Matéria
                  </Button>
                </div>
              </TooltipTrigger>
              {!isEspelhoOpen && (
                <TooltipContent>
                  Abra o espelho para adicionar matérias
                </TooltipContent>
              )}
              {!canAddItem && isEspelhoOpen && (
                <TooltipContent>
                  Sem permissão para adicionar matérias
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este bloco? Todas as matérias dentro dele também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
