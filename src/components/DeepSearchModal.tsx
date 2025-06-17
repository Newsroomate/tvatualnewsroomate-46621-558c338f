
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { fetchTelejornais } from "@/services/api";
import { performDeepSearch, DeepSearchFilters, DeepSearchResult } from "@/services/deep-search-api";
import { Telejornal } from "@/types";

interface DeepSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const searchFields = [
  { id: 'retranca', label: 'Retranca' },
  { id: 'clip', label: 'Clip' },
  { id: 'texto', label: 'Corpo da Matéria' },
  { id: 'cabeca', label: 'Cabeça' },
  { id: 'gc', label: 'GC' },
  { id: 'reporter', label: 'Repórter' }
];

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

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setSelectedFields(prev => 
      checked 
        ? [...prev, fieldId]
        : prev.filter(id => id !== fieldId)
    );
  };

  const handleTelejornalToggle = (telejornalId: string, checked: boolean) => {
    setSelectedTelejornais(prev => 
      checked 
        ? [...prev, telejornalId]
        : prev.filter(id => id !== telejornalId)
    );
  };

  const handleSearch = async () => {
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

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={index} className="bg-yellow-200">{part}</mark> : part
    );
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Filtros de Busca</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Campo de busca */}
                  <div>
                    <Label htmlFor="search-query">Palavra-chave *</Label>
                    <Input
                      id="search-query"
                      placeholder="Digite sua busca..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  {/* Campos para buscar */}
                  <div>
                    <Label>Campos para buscar</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {searchFields.map(field => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                          />
                          <Label htmlFor={field.id} className="text-sm">{field.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de data */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Data inicial</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Data final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Filtro de telejornais */}
                  <div>
                    <Label>Telejornais (opcional)</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2 mt-2">
                      {telejornais.map(telejornal => (
                        <div key={telejornal.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tj-${telejornal.id}`}
                            checked={selectedTelejornais.includes(telejornal.id)}
                            onCheckedChange={(checked) => handleTelejornalToggle(telejornal.id, checked as boolean)}
                          />
                          <Label htmlFor={`tj-${telejornal.id}`} className="text-sm">{telejornal.nome}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex space-x-2">
                    <Button onClick={handleSearch} disabled={isSearching} className="flex-1">
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Buscar
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resultados */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Resultados da Busca</span>
                    {hasSearched && (
                      <Badge variant="secondary">
                        {searchResults.length} resultado(s)
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasSearched && !isSearching && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Digite uma palavra-chave e clique em "Buscar" para ver os resultados</p>
                    </div>
                  )}

                  {isSearching && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Buscando...</p>
                    </div>
                  )}

                  {hasSearched && searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum resultado encontrado para sua busca</p>
                    </div>
                  )}

                  {hasSearched && searchResults.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.map((result) => (
                        <Card key={result.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-sm">{result.retranca}</h4>
                                <div className="flex space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {result.telejornal_nome}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {result.bloco_nome}
                                  </Badge>
                                </div>
                              </div>
                              
                              {result.clip && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Clip:</strong> {result.clip}
                                </p>
                              )}
                              
                              {result.reporter && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Repórter:</strong> {result.reporter}
                                </p>
                              )}
                              
                              {result.highlight_text && (
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  <strong className="capitalize">{result.highlight_field}:</strong>{" "}
                                  {highlightText(result.highlight_text, query)}
                                </div>
                              )}
                              
                              <div className="text-xs text-muted-foreground">
                                Atualizado em: {format(new Date(result.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
