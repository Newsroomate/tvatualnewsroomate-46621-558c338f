
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchTelejornais } from "@/services/api";
import { Telejornal } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GeneralScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClosedRundown {
  id: string;
  jornal: string;
  data: string;
  dataFormatted: string;
  hora: string;
  status: string;
}

export const GeneralScheduleModal = ({ isOpen, onClose }: GeneralScheduleModalProps) => {
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [selectedJornal, setSelectedJornal] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [showTimeRange, setShowTimeRange] = useState<boolean>(false);
  const [closedRundowns, setClosedRundowns] = useState<ClosedRundown[]>([]);
  const [filteredRundowns, setFilteredRundowns] = useState<ClosedRundown[]>([]);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);
  const [selectedRundown, setSelectedRundown] = useState<ClosedRundown | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
      loadClosedRundowns();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [selectedJornal, selectedDate, selectedTime, startTime, endTime, showTimeRange, closedRundowns]);

  const loadTelejornais = async () => {
    try {
      const data = await fetchTelejornais();
      setTelejornais(data);
      if (data.length > 0 && !selectedJornal) {
        setSelectedJornal(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar telejornais:", error);
    }
  };

  const loadClosedRundowns = async () => {
    // In a real implementation, this would fetch from the database
    // For now, we'll use more realistic sample data
    const sampleData: ClosedRundown[] = [
      {
        id: "1",
        jornal: "Jornal da Manhã",
        data: "2025-05-20",
        dataFormatted: "20/05/2025",
        hora: "07:30",
        status: "Fechado"
      },
      {
        id: "2",
        jornal: "Jornal do Meio-Dia",
        data: "2025-05-19",
        dataFormatted: "19/05/2025",
        hora: "12:00",
        status: "Fechado"
      },
      {
        id: "3",
        jornal: "Jornal da Noite",
        data: "2025-05-18", 
        dataFormatted: "18/05/2025",
        hora: "19:45",
        status: "Fechado"
      },
      {
        id: "4",
        jornal: "Bom Dia Brasil",
        data: "2025-05-20",
        dataFormatted: "20/05/2025",
        hora: "06:00",
        status: "Fechado"
      }
    ];
    
    setClosedRundowns(sampleData);
    setFilteredRundowns(sampleData);
  };

  const applyFilters = () => {
    let filtered = [...closedRundowns];
    
    // Filter by journal
    if (selectedJornal) {
      const jornal = telejornais.find(j => j.id === selectedJornal);
      if (jornal) {
        filtered = filtered.filter(rundown => 
          rundown.jornal.toLowerCase().includes(jornal.nome.toLowerCase()));
      }
    }
    
    // Filter by date
    if (selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(rundown => rundown.data === dateString);
    }
    
    // Filter by time or time range
    if (showTimeRange) {
      if (startTime && endTime) {
        filtered = filtered.filter(rundown => {
          return rundown.hora >= startTime && rundown.hora <= endTime;
        });
      }
    } else if (selectedTime) {
      filtered = filtered.filter(rundown => rundown.hora === selectedTime);
    }
    
    setFilteredRundowns(filtered);
  };

  const handleVisualizarEspelho = (rundown: ClosedRundown) => {
    setSelectedRundown(rundown);
    setIsReadOnlyMode(true);
  };

  const closeReadOnlyMode = () => {
    setIsReadOnlyMode(false);
    setSelectedRundown(null);
  };

  const formatSelectedDate = () => {
    if (selectedDate) {
      return format(selectedDate, "dd/MM/yyyy");
    }
    return "";
  };

  if (isReadOnlyMode && selectedRundown) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
          <div className="bg-gray-200 p-2 -mt-4 -mx-4 mb-4 flex justify-between items-center">
            <span className="font-medium text-gray-700">Espelho em modo de leitura - {selectedRundown.jornal} - {selectedRundown.dataFormatted}</span>
            <Button variant="outline" size="sm" onClick={closeReadOnlyMode}>
              Voltar
            </Button>
          </div>
          
          <div className="overflow-auto flex-grow">
            <h3 className="font-medium mb-2">Blocos</h3>
            {/* Sample read-only content */}
            <div className="border rounded-md p-4 mb-4 bg-gray-50">
              <h4 className="font-medium mb-2">Bloco 1 - Abertura</h4>
              <div className="space-y-2">
                <div className="border-l-4 border-blue-500 pl-2 py-1">
                  <p className="font-medium">Escalada</p>
                  <p className="text-sm text-gray-600">Duração: 1:30 - Ao vivo</p>
                </div>
                <div className="border-l-4 border-green-500 pl-2 py-1">
                  <p className="font-medium">Manchetes do dia</p>
                  <p className="text-sm text-gray-600">Duração: 2:45 - VT</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4 mb-4 bg-gray-50">
              <h4 className="font-medium mb-2">Bloco 2 - Notícias</h4>
              <div className="space-y-2">
                <div className="border-l-4 border-yellow-500 pl-2 py-1">
                  <p className="font-medium">Reportagem especial</p>
                  <p className="text-sm text-gray-600">Duração: 3:10 - VT</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-2 py-1">
                  <p className="font-medium">Entrevista</p>
                  <p className="text-sm text-gray-600">Duração: 4:00 - Ao vivo</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4 border-t pt-4">
            <Button onClick={closeReadOnlyMode}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Espelho Geral</DialogTitle>
          <DialogDescription>
            Visualize e filtre espelhos fechados de telejornais anteriores
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Jornal</label>
            <Select
              value={selectedJornal}
              onValueChange={setSelectedJornal}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um telejornal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os telejornais</SelectItem>
                {telejornais.map((jornal) => (
                  <SelectItem key={jornal.id} value={jornal.id}>
                    {jornal.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-10"
                >
                  {selectedDate ? (
                    formatSelectedDate()
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário
              <button 
                onClick={() => setShowTimeRange(!showTimeRange)} 
                className="ml-2 text-xs text-blue-600 hover:underline"
              >
                {showTimeRange ? "Usar horário único" : "Usar faixa de horário"}
              </button>
            </label>
            
            {showTimeRange ? (
              <div className="flex space-x-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full"
                />
                <span className="flex items-center">até</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full"
                />
              </div>
            ) : (
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full"
              />
            )}
          </div>
        </div>

        <div className="overflow-auto flex-grow">
          <h3 className="font-medium mb-2">Espelhos Fechados</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jornal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRundowns.length > 0 ? (
                filteredRundowns.map((rundown) => (
                  <TableRow key={rundown.id}>
                    <TableCell>{rundown.jornal}</TableCell>
                    <TableCell>{rundown.dataFormatted}</TableCell>
                    <TableCell>{rundown.hora}</TableCell>
                    <TableCell>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {rundown.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        className="text-secondary hover:text-primary flex items-center gap-1 text-xs"
                        onClick={() => handleVisualizarEspelho(rundown)}
                      >
                        <Eye className="h-3 w-3" />
                        Abrir em modo leitura
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Nenhum espelho fechado encontrado com os filtros selecionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
