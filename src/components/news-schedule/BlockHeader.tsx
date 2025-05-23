
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "./utils";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface BlockHeaderProps {
  blockName: string;
  totalTime: number;
  onAddItem: () => void;
  newItemBlock: string | null;
  blockId: string;
  isEspelhoOpen: boolean;
  canAddItem?: boolean; 
  onRenameBlock?: (blockId: string, newName: string) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export const BlockHeader = ({ 
  blockName, 
  totalTime, 
  onAddItem, 
  newItemBlock, 
  blockId,
  isEspelhoOpen,
  canAddItem = true,
  onRenameBlock,
  onDeleteBlock
}: BlockHeaderProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState(blockName);

  const handleRename = () => {
    if (onRenameBlock && newBlockName.trim() !== "") {
      onRenameBlock(blockId, newBlockName.trim());
      setIsRenameDialogOpen(false);
    }
  };

  return (
    <div className="bg-muted p-3 rounded-t-lg flex justify-between items-center">
      <h2 className="font-bold">{blockName}</h2>
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
        
        {/* Botão de renomear */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsRenameDialogOpen(true)}
                disabled={!isEspelhoOpen || !canAddItem}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            {!isEspelhoOpen && (
              <TooltipContent>
                Abra o espelho para renomear
              </TooltipContent>
            )}
            {!canAddItem && isEspelhoOpen && (
              <TooltipContent>
                Sem permissão para renomear
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        {/* Botão de excluir */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={!isEspelhoOpen || !canAddItem}
                className="text-red-600 hover:text-red-800 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            {!isEspelhoOpen && (
              <TooltipContent>
                Abra o espelho para excluir
              </TooltipContent>
            )}
            {!canAddItem && isEspelhoOpen && (
              <TooltipContent>
                Sem permissão para excluir
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloco "{blockName}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (onDeleteBlock) onDeleteBlock(blockId);
                setIsDeleteDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de renomeação */}
      <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renomear bloco</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o novo nome para o bloco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input 
            value={newBlockName} 
            onChange={(e) => setNewBlockName(e.target.value)}
            placeholder="Nome do bloco"
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewBlockName(blockName)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRename}
              disabled={newBlockName.trim() === "" || newBlockName === blockName}
            >
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
