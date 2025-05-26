
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { SavedRundownDisplay } from "@/services/saved-rundowns-api";

interface SavedRundownTableProps {
  isLoading: boolean;
  savedRundowns: SavedRundownDisplay[];
  onVisualizarEspelho: (rundown: SavedRundownDisplay) => void;
  onClose: () => void;
}

export const SavedRundownTable = ({ 
  isLoading, 
  savedRundowns, 
  onVisualizarEspelho,
  onClose
}: SavedRundownTableProps) => {
  return (
    <>
      <div className="overflow-auto flex-grow">
        <h3 className="font-medium mb-2">Espelhos Salvos</h3>
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
                    Carregando espelhos salvos...
                  </div>
                </TableCell>
              </TableRow>
            ) : savedRundowns.length > 0 ? (
              savedRundowns.map((rundown) => (
                <TableRow key={rundown.id}>
                  <TableCell>{rundown.jornal}</TableCell>
                  <TableCell>{rundown.dataFormatted}</TableCell>
                  <TableCell>{rundown.hora}</TableCell>
                  <TableCell>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {rundown.status}
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
                  Nenhum espelho salvo encontrado com os filtros selecionados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </>
  );
};
