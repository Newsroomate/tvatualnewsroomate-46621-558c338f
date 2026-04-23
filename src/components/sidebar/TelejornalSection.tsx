import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight, ChevronDown, FileText, Video as VideoIcon, Users, Trash2 } from "lucide-react";
import { Telejornal } from "@/types";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrashModal } from "@/components/trash/TrashModal";

// Importação separada para evitar conflito de nome
import { Video } from "lucide-react";

const AUTHORIZED_TRASH_USER_IDS = new Set([
  "512511d0-ff42-4caf-89c6-bf5a9974895c", // leandrovieira007@hotmail.com
  "6c5e3211-d555-472b-8d90-6e6d63daa74b", // ellencristinaaa@gmail.com
]);

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
  const [confirmDelete, setConfirmDelete] = useState<Telejornal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const canDeleteTelejornal = !!user && AUTHORIZED_TRASH_USER_IDS.has(user.id);

  const handleSelectTelejornal = async (journalId: string) => {
    if (journalId === selectedJournal) return;
    onSelectJournal(journalId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !user) return;
    setIsDeleting(true);
    const id = confirmDelete.id;
    try {
      // Snapshot completo do telejornal antes de excluir
      const [
        { data: blocosData },
        { data: pautasLink },
        { data: entrevistasLink },
        { data: reportagensLink },
        { data: espelhosSalvos },
        { data: vmixCfg },
        { data: viewerMsgs },
        { data: telejornalAccess },
      ] = await Promise.all([
        supabase.from("blocos").select("*").eq("telejornal_id", id),
        supabase.from("pautas_telejornal").select("*").eq("telejornal_id", id),
        supabase.from("entrevistas_telejornal").select("*").eq("telejornal_id", id),
        supabase.from("reportagens_telejornal").select("*").eq("telejornal_id", id),
        supabase.from("espelhos_salvos").select("*").eq("telejornal_id", id),
        supabase.from("vmix_settings").select("*").eq("telejornal_id", id),
        supabase.from("viewer_messages").select("*").eq("telejornal_id", id),
        supabase.from("user_telejornal_access").select("*").eq("telejornal_id", id),
      ]);

      const blocoIds = (blocosData ?? []).map((b: any) => b.id);
      let materiasData: any[] = [];
      if (blocoIds.length > 0) {
        const { data: m } = await supabase.from("materias").select("*").in("bloco_id", blocoIds);
        materiasData = m ?? [];
      }

      const snapshot = {
        telejornal: confirmDelete,
        blocos: blocosData ?? [],
        materias: materiasData,
        pautas_telejornal: pautasLink ?? [],
        entrevistas_telejornal: entrevistasLink ?? [],
        reportagens_telejornal: reportagensLink ?? [],
        espelhos_salvos: espelhosSalvos ?? [],
        vmix_settings: vmixCfg ?? [],
        viewer_messages: viewerMsgs ?? [],
        user_telejornal_access: telejornalAccess ?? [],
      };

      // Inserir na lixeira
      const { error: trashError } = await supabase.from("deleted_items_trash").insert({
        entity_type: "telejornal",
        entity_id: id,
        entity_name: confirmDelete.nome,
        snapshot: snapshot as any,
        deleted_by: user.id,
      });
      if (trashError) throw trashError;

      // Cascata de exclusão (filhos primeiro)
      if (blocoIds.length > 0) {
        await supabase.from("materias").delete().in("bloco_id", blocoIds);
      }
      await supabase.from("blocos").delete().eq("telejornal_id", id);
      await supabase.from("pautas_telejornal").delete().eq("telejornal_id", id);
      await supabase.from("entrevistas_telejornal").delete().eq("telejornal_id", id);
      await supabase.from("reportagens_telejornal").delete().eq("telejornal_id", id);
      await supabase.from("espelhos_salvos").delete().eq("telejornal_id", id);
      await supabase.from("vmix_settings").delete().eq("telejornal_id", id);
      await supabase.from("viewer_messages").delete().eq("telejornal_id", id);
      await supabase.from("user_telejornal_access").delete().eq("telejornal_id", id);

      const { error: tjError } = await supabase.from("telejornais").delete().eq("id", id);
      if (tjError) throw tjError;

      toast({
        title: "Telejornal excluído",
        description: `"${confirmDelete.nome}" foi enviado para a lixeira (restaurável por 7 dias).`,
      });
      setConfirmDelete(null);
      onDataChange();
    } catch (err: any) {
      console.error("Erro ao excluir telejornal:", err);
      toast({
        title: "Erro ao excluir",
        description: err?.message ?? "Não foi possível excluir o telejornal.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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
          <div className="flex items-center gap-1.5">
            {canDeleteTelejornal && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsTrashOpen(true)}
                      aria-label="Abrir lixeira"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Lixeira</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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

                      {canDeleteTelejornal && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete(jornal);
                                }}
                                aria-label={`Excluir telejornal ${jornal.nome}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">Excluir telejornal</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir telejornal?</AlertDialogTitle>
            <AlertDialogDescription>
              O telejornal <strong>{confirmDelete?.nome}</strong> e todos os blocos, matérias,
              pautas, reportagens, entrevistas e espelhos vinculados serão movidos para a lixeira.
              Você poderá restaurá-lo nos próximos <strong>7 dias</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        onRestored={onDataChange}
      />
    </div>
  );
};
