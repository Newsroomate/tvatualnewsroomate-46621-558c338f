
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Menu, Copy } from "lucide-react";

interface DualViewMenuButtonProps {
  onActivateDualView: () => void;
}

export const DualViewMenuButton = ({ onActivateDualView }: DualViewMenuButtonProps) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Menu className="h-4 w-4 mr-2" />
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={onActivateDualView}>
            <Copy className="h-4 w-4 mr-2" />
            Visualização Dupla de Espelhos
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
