
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
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchTelejornais, fetchClosedRundowns } from "@/services/api";
import { Telejornal, Bloco, Materia } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Search, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClosedRundown } from "@/services/espelhos-api";
import { useToast } from "@/hooks/use-toast";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";
import { formatTime } from "./news-schedule/utils";

interface GeneralScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // New states for read-only view
  const [rundownBlocks, setRundownBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
      loadClosedRundowns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadClosedRundowns();
    }
  }, [selectedJornal, selectedDate, selectedTime, startTime, endTime, showTimeRange, isOpen]);

  const loadTelejornais = async () => {
    try {
      const data = await fetchTelejornais();
      setTelejornais(data);
      if (data.length > 0 && !selectedJornal) {
        setSelectedJornal("all");
      }
    } catch (error) {
      console.error("Erro ao carregar telejornais:", error);
      toast({
        title: "Erro ao carregar telejornais",
        description: "Não foi possível carregar a lista de telejornais",
        variant: "destructive"
      });
    }
  };

  const loadClosedRundowns = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClosedRundowns(
        selectedJornal === "all" ? undefined : selectedJornal, 
        selectedDate, 
        selectedTime,
        showTimeRange ? startTime : undefined,
        showTimeRange ? endTime : undefined
      );
      
      setClosedRundowns(data);
      setFilteredRundowns(data);
      
      if (data.length === 0) {
        console.log("Nenhum espelho fechado encontrado com os filtros selecionados");
      } else {
        console.log(`Encontrados ${data.length} espelhos fechados`);
      }
    } catch (error) {
      console.error("Erro ao carregar espelhos fechados:", error);
      toast({
        title: "Erro ao carregar espelhos",
        description: "Não foi possível carregar os espelhos fechados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualizarEspelho = async (rundown: ClosedRundown) => {
    setSelectedRundown(rundown);
    setIsReadOnlyMode(true);
    setIsLoadingBlocks(true);
    
    try {
      // Fetch blocks for this telejornal
      const blocks = await fetchBlocosByTelejornal(rundown.id);
      
      if (!blocks || blocks.length === 0) {
        toast({
          title: "Sem blocos",
          description: "Não há blocos disponíveis para este espelho",
        });
        setRundownBlocks([]);
        return;
      }
      
      // For each block, fetch its materias
      const blocksWithItems = await Promise.all(
        blocks.map(async (block) => {
          const materias = await fetchMateriasByBloco(block.id);
          const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
          
          return {
            ...block,
            items: materias,
            totalTime
          };
        })
      );
      
      setRundownBlocks(blocksWithItems);
    } catch (error) {
      console.error("Erro ao carregar blocos e matérias:", error);
      toast({
        title: "Erro ao carregar espelho",
        description: "Não foi possível carregar os detalhes do espelho",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  const closeReadOnlyMode = () => {
    setIsReadOnlyMode(false);
    setSelectedRundown(null);
    setRundownBlocks([]);
  };

  const formatSelectedDate = () => {
    if (selectedDate) {
      return format(selectedDate, "dd/MM/yyyy");
    }
    return "";
  };

  // Status color classes
  const getStatusClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isReadOnlyMode && selectedRundown) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
          <div className="bg-gray-200 p-2 -mt-4 -mx-4 mb-4 flex justify-between items-center">
            <span className="font-medium text-gray-700">
              Espelho em modo de leitura - {selectedRundown.jornal} - {selectedRundown.dataFormatted}
            </span>
            <Button variant="outline" size="sm" onClick={closeReadOnlyMode}>
              Voltar
            </Button>
          </div>
          
          <div className="overflow-auto flex-grow">
            {isLoadingBlocks ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Carregando espelho...</span>
              </div>
            ) : rundownBlocks.length > 0 ? (
              <div className="space-y-6">
                <h3 className="font-medium mb-2">Blocos</h3>
                {rundownBlocks.map((block) => (
                  <div key={block.id} className="border rounded-md p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{block.nome}</h4>
                      <span className="text-sm font-medium text-gray-500">
                        Tempo: {formatTime(block.totalTime)}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 text-xs uppercase">
                          <tr>
                            <th className="py-2 px-3 text-left">Página</th>
                            <th className="py-2 px-3 text-left">Retranca</th>
                            <th className="py-2 px-3 text-left">Clipe</th>
                            <th className="py-2 px-3 text-left">Duração</th>
                            <th className="py-2 px-3 text-left">Status</th>
                            <th className="py-2 px-3 text-left">Repórter</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {block.items.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-3 text-center text-gray-500">
                                Nenhuma matéria neste bloco
                              </td>
                            </tr>
                          ) : (
                            block.items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3">{item.pagina}</td>
                                <td className="py-2 px-3 font-medium">{item.retranca}</td>
                                <td className="py-2 px-3 font-mono text-xs">{item.clip || ''}</td>
                                <td className="py-2 px-3">{formatTime(item.duracao)}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status || 'draft')}`}>
                                    {item.status || 'draft'}
                                  </span>
                                </td>
                                <td className="py-2 px-3">{item.reporter || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-500">Nenhum bloco encontrado para este espelho</p>
              </div>
            )}
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
                <SelectItem value="all">Todos os telejornais</SelectItem>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Carregando espelhos fechados...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRundowns.length > 0 ? (
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
