
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Eye, Loader2 } from "lucide-react";
import { ClosedRundown } from "@/services/espelhos-api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { translateStatus } from "@/components/news-schedule/utils";

interface RundownTableProps {
  isLoading: boolean;
  filteredRundowns: ClosedRundown[];
  onVisualizarEspelho: (rundown: ClosedRundown) => void;
  onClose: () => void; // Adding onClose prop to allow modal closing
}

export const RundownTable = ({ 
  isLoading, 
  filteredRundowns, 
  onVisualizarEspelho,
  onClose 
}: RundownTableProps) => {
  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
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
                  <TableCell>{rundown.nome_telejornal}</TableCell>
                  <TableCell>{formatDate(rundown.data_fechamento)}</TableCell>
                  <TableCell>{rundown.horario}</TableCell>
                  <TableCell>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {translateStatus(rundown.status || "closed")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      className="text-secondary hover:text-primary flex items-center gap-1 text-xs"
                      onClick={() => onVisualizarEspelho(rundown)}
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
    </>
  );
};

