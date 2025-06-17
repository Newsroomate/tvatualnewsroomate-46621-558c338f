
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Telejornal } from "@/types";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TelejornalSectionProps {
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  onAddTelejornal: () => void;
  isLoading: boolean;
  onDataChange: () => void;
}

export const TelejornalSection = ({
  telejornais,
  selectedJournal,
  onSelectJournal,
  onAddTelejornal,
  isLoading,
  onDataChange
}: TelejornalSectionProps) => {
  const handleSelectTelejornal = async (journalId: string) => {
    if (journalId === selectedJournal) return;
    onSelectJournal(journalId);
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase text-gray-500">Telejornais</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAddTelejornal}>
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Adicionar Telejornal</span>
        </Button>
      </div>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <ul className="space-y-1">
          {telejornais.map(jornal => (
            <li key={jornal.id} className="relative">
              <Button 
                variant={selectedJournal === jornal.id ? "secondary" : "ghost"} 
                className={`w-full justify-start text-left ${jornal.espelho_aberto ? 'border-l-4 border-green-500 pl-3' : ''}`}
                onClick={() => handleSelectTelejornal(jornal.id)}
              >
                <span className="truncate">{jornal.nome}</span>
                {jornal.espelho_aberto && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                      </TooltipTrigger>
                      <TooltipContent>Espelho aberto</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
