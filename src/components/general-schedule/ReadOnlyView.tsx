import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ClosedRundown } from "@/services/espelhos-api";
import { Bloco, Materia } from "@/types";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "../news-schedule/utils";
import { Loader2 } from "lucide-react";

interface ReadOnlyViewProps {
  selectedRundown: ClosedRundown;
  onClose: () => void;
}

export const ReadOnlyView = ({ selectedRundown, onClose }: ReadOnlyViewProps) => {
  const [rundownBlocks, setRundownBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(false);
  const { toast } = useToast();
  
  useEffect(() => {
    loadRundownData();
  }, [selectedRundown.id]);
  
  const loadRundownData = async () => {
    setIsLoadingBlocks(true);
    
    try {
      // Fetch blocks for this telejornal
      const blocks = await fetchBlocosByTelejornal(selectedRundown.id);
      
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
  
  return (
    <>
      <div className="bg-gray-200 p-2 -mt-4 -mx-4 mb-4 flex justify-between items-center">
        <span className="font-medium text-gray-700">
          Espelho em modo de leitura - {selectedRundown.jornal} - {selectedRundown.dataFormatted}
        </span>
        <Button variant="outline" size="sm" onClick={onClose}>
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
        <Button onClick={onClose}>Fechar</Button>
      </DialogFooter>
    </>
  );
};
