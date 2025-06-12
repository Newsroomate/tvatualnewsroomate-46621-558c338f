
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useClipboard } from "@/hooks/useClipboard";

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchFilters {
  texto: string;
  retranca: string;
  reporter: string;
  status: string;
  tipo_material: string;
  pagina: string;
  cabeca: string;
  gc: string;
  clip: string;
}

export const AdvancedSearchModal = ({ isOpen, onClose }: AdvancedSearchModalProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    texto: '',
    retranca: '',
    reporter: '',
    status: '',
    tipo_material: '',
    pagina: '',
    cabeca: '',
    gc: '',
    clip: ''
  });
  
  const [results, setResults] = useState<Materia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { toast } = useToast();
  const { copyMateria } = useClipboard();

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Build the query with filters
      let query = supabase
        .from('materias')
        .select(`
          *,
          blocos!inner(nome, telejornais!inner(nome))
        `);

      // Apply filters
      if (filters.texto.trim()) {
        query = query.ilike('texto', `%${filters.texto.trim()}%`);
      }
      if (filters.retranca.trim()) {
        query = query.ilike('retranca', `%${filters.retranca.trim()}%`);
      }
      if (filters.reporter.trim()) {
        query = query.ilike('reporter', `%${filters.reporter.trim()}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.tipo_material.trim()) {
        query = query.ilike('tipo_material', `%${filters.tipo_material.trim()}%`);
      }
      if (filters.pagina.trim()) {
        query = query.ilike('pagina', `%${filters.pagina.trim()}%`);
      }
      if (filters.cabeca.trim()) {
        query = query.ilike('cabeca', `%${filters.cabeca.trim()}%`);
      }
      if (filters.gc.trim()) {
        query = query.ilike('gc', `%${filters.gc.trim()}%`);
      }
      if (filters.clip.trim()) {
        query = query.ilike('clip', `%${filters.clip.trim()}%`);
      }

      // Order by most recent
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform the data to match our Materia type
      const transformedResults = data.map(item => ({
        ...item,
        titulo: item.retranca || "Sem título"
      })) as Materia[];

      setResults(transformedResults);
      
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Ocorreu um erro ao realizar a busca avançada.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyMateria = (materia: Materia) => {
    copyMateria(materia);
    toast({
      title: "Matéria copiada",
      description: `"${materia.retranca}" foi copiada. Use Ctrl+V para colar.`,
    });
  };

  const clearFilters = () => {
    setFilters({
      texto: '',
      retranca: '',
      reporter: '',
      status: '',
      tipo_material: '',
      pagina: '',
      cabeca: '',
      gc: '',
      clip: ''
    });
    setResults([]);
    setHasSearched(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Busca Avançada de Matérias</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <Label htmlFor="texto">Texto da Matéria</Label>
              <Textarea
                id="texto"
                placeholder="Buscar dentro do texto..."
                value={filters.texto}
                onChange={(e) => handleFilterChange('texto', e.target.value)}
                className="h-20"
              />
            </div>
            
            <div>
              <Label htmlFor="retranca">Retranca</Label>
              <Input
                id="retranca"
                placeholder="Nome da retranca..."
                value={filters.retranca}
                onChange={(e) => handleFilterChange('retranca', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="reporter">Repórter</Label>
              <Input
                id="reporter"
                placeholder="Nome do repórter..."
                value={filters.reporter}
                onChange={(e) => handleFilterChange('reporter', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="pagina">Página</Label>
              <Input
                id="pagina"
                placeholder="Número da página..."
                value={filters.pagina}
                onChange={(e) => handleFilterChange('pagina', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="clip">Clipe</Label>
              <Input
                id="clip"
                placeholder="Nome do clipe..."
                value={filters.clip}
                onChange={(e) => handleFilterChange('clip', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="cabeca">Cabeça</Label>
              <Input
                id="cabeca"
                placeholder="Texto da cabeça..."
                value={filters.cabeca}
                onChange={(e) => handleFilterChange('cabeca', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="gc">GC</Label>
              <Input
                id="gc"
                placeholder="Texto do GC..."
                value={filters.gc}
                onChange={(e) => handleFilterChange('gc', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="tipo_material">Tipo de Material</Label>
              <Input
                id="tipo_material"
                placeholder="Tipo do material..."
                value={filters.tipo_material}
                onChange={(e) => handleFilterChange('tipo_material', e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isSearching} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {hasSearched && (
              <div className="p-4">
                <h3 className="font-semibold mb-3">
                  Resultados da Busca ({results.length} encontrados)
                </h3>
                
                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma matéria encontrada com os critérios especificados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {results.map((materia) => (
                      <div
                        key={materia.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-lg">{materia.retranca}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyMateria(materia)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copiar
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                          {materia.reporter && (
                            <span><strong>Repórter:</strong> {materia.reporter}</span>
                          )}
                          {materia.pagina && (
                            <span><strong>Página:</strong> {materia.pagina}</span>
                          )}
                          {materia.status && (
                            <span><strong>Status:</strong> {materia.status}</span>
                          )}
                          {materia.duracao && (
                            <span><strong>Duração:</strong> {materia.duracao}s</span>
                          )}
                        </div>
                        
                        {materia.texto && (
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {materia.texto}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
