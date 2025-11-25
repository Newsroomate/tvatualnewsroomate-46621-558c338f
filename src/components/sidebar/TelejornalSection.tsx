
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight, ChevronDown, FileText, Video, Users } from "lucide-react";
import { Telejornal } from "@/types";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TelejornalSectionProps {
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  onAddTelejornal: () => void;
  isLoading: boolean;
  onDataChange: () => void;
  onOpenPautas?: (telejornalId: string) => void;
  onOpenReportagens?: (telejornalId: string) => void;
  onOpenEntrevistas?: (telejornalId: string) => void;
}

export const TelejornalSection = ({
  telejornais,
  selectedJournal,
  onSelectJournal,
  onAddTelejornal,
  isLoading,
  onDataChange,
  onOpenPautas,
  onOpenReportagens,
  onOpenEntrevistas
}: TelejornalSectionProps) => {
  const [expandedTelejornais, setExpandedTelejornais] = useState<Set<string>>(new Set());

  const handleSelectTelejornal = async (journalId: string) => {
    if (journalId === selectedJournal) return;
    onSelectJournal(journalId);
  };

  const toggleExpanded = (journalId: string) => {
    setExpandedTelejornais(prev => {
      const newSet = new Set(prev);
      if (newSet.has(journalId)) {
        newSet.delete(journalId);
      } else {
        newSet.add(journalId);
      }
      return newSet;
    });
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
          {telejornais.map(jornal => {
            const isEspelhoAberto = jornal.espelho_aberto;
            const isExpanded = expandedTelejornais.has(jornal.id);
            
            return (
              <li key={jornal.id} className="relative">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(jornal.id)}>
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <Button 
                      variant={selectedJournal === jornal.id ? "secondary" : "ghost"} 
                      className={`flex-1 justify-start text-left ${isEspelhoAberto ? 'border-l-2 border-green-500' : ''}`}
                      onClick={() => handleSelectTelejornal(jornal.id)}
                    >
                      <span className="truncate">{jornal.nome}</span>
                      {isEspelhoAberto && (
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
                  </div>
                  
                  <CollapsibleContent>
                    <div className="ml-9 mt-1 space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => onOpenPautas?.(jornal.id)}
                      >
                        <FileText className="mr-2 h-3 w-3" />
                        Pautas
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => onOpenReportagens?.(jornal.id)}
                      >
                        <Video className="mr-2 h-3 w-3" />
                        Reportagens
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => onOpenEntrevistas?.(jornal.id)}
                      >
                        <Users className="mr-2 h-3 w-3" />
                        Entrevistas
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
