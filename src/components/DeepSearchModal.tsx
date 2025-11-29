
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchTelejornais } from "@/services/api";
import { performDeepSearch, DeepSearchFilters, DeepSearchResult } from "@/services/deep-search-api";
import { useClipboard } from "@/hooks/useClipboard";
import { Telejornal } from "@/types";
import { DeepSearchFilters as FiltersComponent } from "./deep-search/DeepSearchFilters";
import { DeepSearchResults } from "./deep-search/DeepSearchResults";
import { convertSearchResultToMateria } from "./deep-search/utils";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

interface DeepSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeepSearchModal = ({ isOpen, onClose }: DeepSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>(['retranca', 'texto']);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [selectedTelejornais, setSelectedTelejornais] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DeepSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { copyMateria } = useClipboard();
  const { checkPermission } = usePermissionGuard();

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
    }
  }, [isOpen]);

  const loadTelejornais = async () => {
    try {
      const data = await fetchTelejornais();
      setTelejornais(data);
    } catch (error) {
      console.error("Erro ao carregar telejornais:", error);
      toast({
        title: "Erro ao carregar telejornais",
        description: "Não foi possível carregar a lista de telejornais",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!checkPermission('view', 'deep_search')) {
      return;
    }
    
    if (!query.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite uma palavra-chave para buscar",
        variant: "destructive"
      });
      return;
    }

    if (selectedFields.length === 0) {
      toast({
        title: "Selecione os campos",
        description: "Selecione pelo menos um campo para buscar",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    try {
      const filters: DeepSearchFilters = {
        query: query.trim(),
        fields: selectedFields,
        startDate,
        endDate,
        telejornalIds: selectedTelejornais.length > 0 ? selectedTelejornais : undefined
      };

      const results = await performDeepSearch(filters);
      setSearchResults(results);
      setHasSearched(true);

      toast({
        title: "Busca concluída",
        description: `Encontrados ${results.length} resultados`,
      });
    } catch (error) {
      console.error("Erro na busca:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelectedFields(['retranca', 'texto']);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedTelejornais([]);
    setSearchResults([]);
    setHasSearched(false);
  };

  // Handler para copiar matéria da busca profunda
  const handleCopyMateria = (result: DeepSearchResult) => {
    console.log('Copiando matéria da busca profunda:', {
      id: result.id,
      retranca: result.retranca,
      campos: Object.keys(result).length
    });

    const standardMateria = convertSearchResultToMateria(result);
    copyMateria(standardMateria);

    toast({
      title: "Matéria copiada da busca",
      description: `"${result.retranca}" foi copiada. Use Ctrl+V para colar no espelho atual.`,
    });
  };

  // Handler para editar matéria da busca profunda
  const handleEditMateria = (result: DeepSearchResult) => {
    console.log('Editando matéria da busca profunda:', {
      id: result.id,
      retranca: result.retranca
    });

    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A edição de matérias da busca profunda será implementada em breve.",
      variant: "default"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Busca Profunda
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel de Filtros */}
            <div className="space-y-4">
              <FiltersComponent
                query={query}
                setQuery={setQuery}
                selectedFields={selectedFields}
                setSelectedFields={setSelectedFields}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                telejornais={telejornais}
                selectedTelejornais={selectedTelejornais}
                setSelectedTelejornais={setSelectedTelejornais}
                isSearching={isSearching}
                onSearch={handleSearch}
                onClear={handleClear}
              />
            </div>

            {/* Resultados */}
            <div className="lg:col-span-2">
              <DeepSearchResults
                searchResults={searchResults}
                hasSearched={hasSearched}
                isSearching={isSearching}
                query={query}
                onEditMateria={handleEditMateria}
                onCopyMateria={handleCopyMateria}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
