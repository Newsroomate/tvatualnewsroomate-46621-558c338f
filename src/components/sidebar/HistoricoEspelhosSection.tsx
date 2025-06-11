
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Archive, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Telejornal } from "@/types";
import { ClosedRundownSnapshot, fetchClosedRundownSnapshots } from "@/services/snapshots-api";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HistoricoEspelhosSectionProps {
  telejornais: Telejornal[];
  onOpenHistorico: (snapshot: ClosedRundownSnapshot) => void;
  isLoading?: boolean;
}

export const HistoricoEspelhosSection = ({
  telejornais,
  onOpenHistorico,
  isLoading = false
}: HistoricoEspelhosSectionProps) => {
  const [selectedTelejornal, setSelectedTelejornal] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [espelhos, setEspelhos] = useState<ClosedRundownSnapshot[]>([]);
  const [isLoadingEspelhos, setIsLoadingEspelhos] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    loadEspelhos();
  }, [selectedTelejornal, selectedDate]);

  const loadEspelhos = async () => {
    if (!selectedDate) return;
    
    setIsLoadingEspelhos(true);
    try {
      const data = await fetchClosedRundownSnapshots(
        selectedTelejornal === "all" ? undefined : selectedTelejornal,
        selectedDate
      );
      setEspelhos(data);
    } catch (error) {
      console.error("Erro ao carregar espelhos históricos:", error);
      setEspelhos([]);
    } finally {
      setIsLoadingEspelhos(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="border-t border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Archive className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-800">Histórico de Espelhos</h3>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Telejornal:</label>
            <Select value={selectedTelejornal} onValueChange={setSelectedTelejornal}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Selecionar telejornal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os telejornais</SelectItem>
                {telejornais.map((journal) => (
                  <SelectItem key={journal.id} value={journal.id}>
                    {journal.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-600">Data:</label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-8 text-xs justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-3 w-3" />
                  {selectedDate ? (
                    format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Lista de espelhos */}
        <div className="space-y-2">
          {isLoadingEspelhos ? (
            <div className="text-xs text-gray-500 text-center py-4">
              Carregando espelhos...
            </div>
          ) : espelhos.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4">
              Nenhum espelho encontrado para esta data
            </div>
          ) : (
            espelhos.map((espelho) => (
              <div
                key={espelho.id}
                className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onOpenHistorico(espelho)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-800 truncate">
                      {espelho.nome_telejornal}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {format(new Date(espelho.data_referencia), "dd/MM", { locale: ptBR })}
                      </span>
                      {espelho.horario && (
                        <span className="text-xs text-gray-500">
                          {espelho.horario}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {espelho.estrutura_completa.metadata.total_blocos} bloco(s)
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenHistorico(espelho);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
