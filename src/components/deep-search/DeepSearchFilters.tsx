
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Telejornal } from "@/types";

const searchFields = [
  { id: 'retranca', label: 'Retranca' },
  { id: 'clip', label: 'Clip' },
  { id: 'texto', label: 'Corpo da Matéria' },
  { id: 'cabeca', label: 'Cabeça' },
  { id: 'gc', label: 'GC' },
  { id: 'reporter', label: 'Repórter' }
];

interface DeepSearchFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  selectedFields: string[];
  setSelectedFields: (fields: string[]) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  telejornais: Telejornal[];
  selectedTelejornais: string[];
  setSelectedTelejornais: (ids: string[]) => void;
  isSearching: boolean;
  onSearch: () => void;
  onClear: () => void;
}

export const DeepSearchFilters = ({
  query,
  setQuery,
  selectedFields,
  setSelectedFields,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  telejornais,
  selectedTelejornais,
  setSelectedTelejornais,
  isSearching,
  onSearch,
  onClear
}: DeepSearchFiltersProps) => {
  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setSelectedFields(
      checked 
        ? [...selectedFields, fieldId]
        : selectedFields.filter(id => id !== fieldId)
    );
  };

  const handleTelejornalToggle = (telejornalId: string, checked: boolean) => {
    setSelectedTelejornais(
      checked 
        ? [...selectedTelejornais, telejornalId]
        : selectedTelejornais.filter(id => id !== telejornalId)
    );
  };

  return (
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
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
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
          <Button onClick={onSearch} disabled={isSearching} className="flex-1">
            {isSearching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Buscar
          </Button>
          <Button variant="outline" onClick={onClear}>
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
