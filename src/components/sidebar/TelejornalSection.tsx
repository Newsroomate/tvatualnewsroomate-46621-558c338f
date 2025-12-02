
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight, ChevronDown, FileText, Video as VideoIcon, Users } from "lucide-react";
import { Telejornal } from "@/types";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Importação separada para evitar conflito de nome
import { Video } from "lucide-react";

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
    <div className="border-b border-border/50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Telejornais</h3>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-3 shadow-sm hover:shadow-md transition-all duration-200" 
            onClick={onAddTelejornal}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs font-medium">Novo</span>
          </Button>
        </div>
      </div>
      
      <div className="px-3 pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Carregando...</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
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
                          className="h-8 w-8 p-0 hover:bg-accent/50 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <Button 
                        variant={selectedJournal === jornal.id ? "secondary" : "ghost"} 
                        className={`flex-1 justify-start text-left text-xs font-medium transition-all duration-200 ${
                          isEspelhoAberto ? 'border-l-2 border-green-500' : ''
                        } ${selectedJournal === jornal.id ? 'bg-accent hover:bg-accent/80 shadow-sm' : 'hover:bg-accent/50'}`}
                        onClick={() => handleSelectTelejornal(jornal.id)}
                      >
                        <span className="truncate flex-1">{jornal.nome}</span>
                        {isEspelhoAberto && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">Espelho aberto</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </Button>
                    </div>
                    
                    <CollapsibleContent className="animate-accordion-down">
                      <div className="ml-9 mt-1 space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs hover:bg-accent/50 transition-colors"
                          onClick={() => onOpenPautas?.(jornal.id)}
                        >
                          <FileText className="mr-2 h-3 w-3" />
                          Pautas
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs hover:bg-accent/50 transition-colors"
                          onClick={() => onOpenReportagens?.(jornal.id)}
                        >
                          <VideoIcon className="mr-2 h-3 w-3" />
                          Reportagens
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs hover:bg-accent/50 transition-colors"
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
    </div>
  );
};
