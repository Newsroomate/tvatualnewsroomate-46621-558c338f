import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight, ChevronDown, FileText, Video, Users, Tv } from "lucide-react";
import { Telejornal } from "@/types";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="border-b border-border/50 bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="p-4 space-y-4">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Tv className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">Telejornais</h3>
              <Badge 
                variant="secondary" 
                className="text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm"
              >
                {telejornais.length}
              </Badge>
            </div>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-3 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105" 
            onClick={onAddTelejornal}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs font-medium">Novo</span>
          </Button>
        </div>
      </div>
      
      {/* Telejornais List */}
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
          </div>
        ) : telejornais.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-6 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Tv className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Nenhum telejornal</p>
              <p className="text-xs text-muted-foreground">Crie seu primeiro telejornal</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[300px] pr-1">
            <div className="space-y-2">
              {telejornais.map((jornal, index) => {
                const isEspelhoAberto = jornal.espelho_aberto;
                const isExpanded = expandedTelejornais.has(jornal.id);
                const isSelected = selectedJournal === jornal.id;
                
                return (
                  <div
                    key={jornal.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(jornal.id)}>
                      <div className={`rounded-lg border transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary/50 bg-primary/5 shadow-sm' 
                          : 'border-border/40 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm'
                      }`}>
                        {/* Telejornal Header */}
                        <div className="flex items-center gap-1 p-2">
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-accent/50"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          
                          <Button 
                            variant="ghost"
                            className={`flex-1 justify-start text-left h-auto py-1.5 px-2 ${
                              isSelected ? 'text-primary font-medium' : 'text-foreground hover:text-primary'
                            }`}
                            onClick={() => handleSelectTelejornal(jornal.id)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-medium truncate">{jornal.nome}</span>
                              {isEspelhoAberto && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] font-semibold text-green-700 dark:text-green-300">ABERTO</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Espelho aberto</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </Button>
                        </div>
                        
                        {/* Expanded Content */}
                        <CollapsibleContent>
                          <div className="px-2 pb-2 pt-1 space-y-1 border-t border-border/30 bg-muted/20">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => onOpenPautas?.(jornal.id)}
                            >
                              <FileText className="mr-2 h-3.5 w-3.5" />
                              Pautas
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => onOpenReportagens?.(jornal.id)}
                            >
                              <Video className="mr-2 h-3.5 w-3.5" />
                              Reportagens
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => onOpenEntrevistas?.(jornal.id)}
                            >
                              <Users className="mr-2 h-3.5 w-3.5" />
                              Entrevistas
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
