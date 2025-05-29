
import { useToast } from "@/hooks/use-toast";
import { Materia, Telejornal } from "@/types/index";
import { updateTelejornal, fetchTelejornal, fetchBlocosByTelejornal, fetchMateriasByBloco, deleteAllBlocos } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { canCreateEspelhos } from "@/utils/permission";
import { saveRundownSnapshot } from "@/services/saved-rundowns-api";
import { queryClient } from "./QueryClientProvider";

interface UseLayoutHandlersProps {
  selectedJournal: string | null;
  setSelectedJournal: (id: string | null) => void;
  setSelectedItem: (item: Materia | null) => void;
  setIsEditPanelOpen: (open: boolean) => void;
  currentTelejornal: Telejornal | null;
  setCurrentTelejornal: (telejornal: Telejornal | null) => void;
  setIsCloseRundownDialogOpen: (open: boolean) => void;
  setIsPostCloseModalOpen: (open: boolean) => void;
  setIsSavedRundownsModalOpen: (open: boolean) => void;
  setSelectedViewDate: (date: Date) => void;
}

export const useLayoutHandlers = ({
  selectedJournal,
  setSelectedJournal,
  setSelectedItem,
  setIsEditPanelOpen,
  currentTelejornal,
  setCurrentTelejornal,
  setIsCloseRundownDialogOpen,
  setIsPostCloseModalOpen,
  setIsSavedRundownsModalOpen,
  setSelectedViewDate
}: UseLayoutHandlersProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleSelectJournal = (journalId: string) => {
    setSelectedJournal(journalId);
    // Fechar o painel de edição ao trocar de jornal
    setIsEditPanelOpen(false);
    
    // Fetch telejornal details - mantendo o estado do espelho
    if (journalId) {
      fetchTelejornal(journalId).then(journal => {
        setCurrentTelejornal(journal);
      });
    } else {
      setCurrentTelejornal(null);
    }
  };

  const handleEditItem = (item: Materia) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para editar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedItem(item);
    setIsEditPanelOpen(true);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    setSelectedItem(null);
    
    // Explicitly invalidate queries to force a refresh of the data
    // This ensures that even if realtime updates fail, we still get fresh data
    if (selectedJournal) {
      console.log("Explicitly invalidating queries to refresh data");
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
    }
    
    console.log("Edit panel closed - UI will update via Realtime subscription and explicit query invalidation");
  };

  const saveCurrentRundownSnapshot = async () => {
    if (!selectedJournal || !currentTelejornal) return;

    try {
      console.log("Salvando snapshot do espelho atual...");
      
      // Fetch current blocks and materias
      const blocks = await fetchBlocosByTelejornal(selectedJournal);
      const blocksWithItems = await Promise.all(
        blocks.map(async (block) => {
          const materias = await fetchMateriasByBloco(block.id);
          return {
            id: block.id,
            nome: block.nome,
            ordem: block.ordem,
            items: materias.map(materia => ({
              id: materia.id,
              retranca: materia.retranca,
              clip: materia.clip,
              duracao: materia.duracao || 0,
              pagina: materia.pagina,
              reporter: materia.reporter,
              status: materia.status,
              texto: materia.texto,
              cabeca: materia.cabeca,
              ordem: materia.ordem
            }))
          };
        })
      );

      // Save the snapshot
      await saveRundownSnapshot({
        telejornal_id: selectedJournal,
        data_referencia: new Date().toISOString().split('T')[0],
        nome: currentTelejornal.nome,
        estrutura: {
          blocos: blocksWithItems
        }
      });

      console.log("Snapshot salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar snapshot:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o snapshot do espelho",
        variant: "destructive"
      });
    }
  };

  const handleToggleRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    // Verificar permissões para abrir/fechar espelho
    if (!canCreateEspelhos(profile)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para abrir ou fechar espelhos.",
        variant: "destructive"
      });
      return;
    }
    
    // Se o espelho está aberto e o usuário deseja fechá-lo, mostrar diálogo de confirmação
    if (currentTelejornal.espelho_aberto) {
      setIsCloseRundownDialogOpen(true);
      return;
    }
    
    // Se o espelho está fechado e o usuário deseja abri-lo, mostrar modal de opções
    if (!currentTelejornal.espelho_aberto) {
      setIsPostCloseModalOpen(true);
      return;
    }
  };

  const handleConfirmCloseRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    try {
      // Save snapshot before closing
      await saveCurrentRundownSnapshot();
      
      // Fechar o espelho do telejornal
      await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      // Atualizar o estado local
      setCurrentTelejornal({
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      toast({
        title: "Espelho fechado",
        description: `Espelho de ${currentTelejornal.nome} fechado e salvo`,
        variant: "default"
      });
      
      // Fechar o diálogo
      setIsCloseRundownDialogOpen(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
    } catch (error) {
      console.error("Erro ao fechar espelho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fechar o espelho",
        variant: "destructive"
      });
    }
  };

  const handleCreateNewRundown = async (loadLastBlock: boolean = true) => {
    if (!selectedJournal || !currentTelejornal) return;

    try {
      console.log("Criando novo espelho...");
      
      // Delete all current blocks and materias
      await deleteAllBlocos(selectedJournal);
      
      // Open the rundown
      await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: true
      });
      
      // Update local state
      setCurrentTelejornal({
        ...currentTelejornal,
        espelho_aberto: true
      });
      
      // A criação do primeiro bloco com dados do último bloco será tratada
      // automaticamente pelo componente NewsSchedule quando detectar espelho aberto sem blocos
      
      toast({
        title: "Novo espelho criado",
        description: `Novo espelho de ${currentTelejornal.nome} criado e aberto com o último bloco carregado`,
        variant: "default"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      
    } catch (error) {
      console.error("Erro ao criar novo espelho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar um novo espelho",
        variant: "destructive"
      });
    }
  };

  const handleViewByDate = (date: Date) => {
    setSelectedViewDate(date);
    setIsSavedRundownsModalOpen(true);
  };

  return {
    handleSelectJournal,
    handleEditItem,
    handleCloseEditPanel,
    handleToggleRundown,
    handleConfirmCloseRundown,
    handleCreateNewRundown,
    handleViewByDate
  };
};
