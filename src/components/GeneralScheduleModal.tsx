
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchTelejornais } from "@/services/api";
import { Telejornal } from "@/types";

interface GeneralScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneralScheduleModal = ({ isOpen, onClose }: GeneralScheduleModalProps) => {
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [selectedJornal, setSelectedJornal] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
    }
  }, [isOpen]);

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

  // Dados fictícios para demonstração
  const espelhosFechados = [
    {
      id: "1",
      jornal: "Jornal da Manhã",
      data: "20/05/2025",
      status: "Fechado"
    },
    {
      id: "2",
      jornal: "Jornal do Meio-Dia",
      data: "19/05/2025",
      status: "Fechado"
    }
  ];

  const handleVisualizarEspelho = (espelhoId: string) => {
    console.log("Visualizar espelho:", espelhoId);
    // Aqui implementaríamos a lógica para visualizar o espelho em modo somente leitura
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Espelho Geral</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
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
                {telejornais.map((jornal) => (
                  <SelectItem key={jornal.id} value={jornal.id}>
                    {jornal.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
            <input 
              type="datetime-local" 
              className="w-full border border-gray-300 rounded-md p-2"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-auto flex-grow">
          <h3 className="font-medium mb-2">Espelhos Fechados</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jornal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {espelhosFechados.map((espelho) => (
                <TableRow key={espelho.id}>
                  <TableCell>{espelho.jornal}</TableCell>
                  <TableCell>{espelho.data}</TableCell>
                  <TableCell>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {espelho.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      className="text-secondary hover:text-primary"
                      onClick={() => handleVisualizarEspelho(espelho.id)}
                    >
                      Visualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
