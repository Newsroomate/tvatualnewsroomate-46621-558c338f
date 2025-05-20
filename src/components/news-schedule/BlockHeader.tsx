
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "./utils";

interface BlockHeaderProps {
  blockName: string;
  totalTime: number;
  onAddItem: () => void;
  newItemBlock: string | null;
  blockId: string;
  isEspelhoOpen: boolean;
}

export const BlockHeader = ({ 
  blockName, 
  totalTime, 
  onAddItem, 
  newItemBlock, 
  blockId,
  isEspelhoOpen
}: BlockHeaderProps) => {
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
                  disabled={newItemBlock === blockId || !isEspelhoOpen}
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
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
