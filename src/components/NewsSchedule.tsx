
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
  createBloco, 
  createMateria 
} from "@/services/api";
import { Bloco, Materia, Telejornal } from "@/types";
import { fetchTelejornais } from "@/services/api";

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (item: Materia) => void;
}

export const NewsSchedule = ({ selectedJournal, onEditItem }: NewsScheduleProps) => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [currentTelejornal, setCurrentTelejornal] = useState<Telejornal | null>(null);

  // Buscar telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
    onSuccess: (data) => {
      setTelejornais(data);
      const journal = data.find(j => j.id === selectedJournal);
      if (journal) {
        setCurrentTelejornal(journal);
      }
    }
  });

  // Buscar blocos do telejornal selecionado
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal,
    onSuccess: async (blocosData) => {
      const blocosComItems = await Promise.all(
        blocosData.map(async (bloco) => {
          const materias = await fetchMateriasByBloco(bloco.id);
          const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
          return {
            ...bloco,
            items: materias,
            totalTime
          };
        })
      );
      
      setBlocks(blocosComItems);
      
      // Criar automaticamente o Bloco 1 se não existir nenhum bloco
      if (blocosComItems.length === 0 && selectedJournal) {
        handleAddBlock();
      }
    }
  });

  // Atualiza o telejornal atual quando o selectedJournal muda
  useEffect(() => {
    if (selectedJournal && telejornais.length > 0) {
      const journal = telejornais.find(j => j.id === selectedJournal);
      if (journal) {
        setCurrentTelejornal(journal);
      }
    } else {
      setCurrentTelejornal(null);
    }
  }, [selectedJournal, telejornais]);

  // Recalcular tempo total do jornal quando os blocos mudam
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  const handleAddBlock = async () => {
    if (!selectedJournal) return;
    
    try {
      const nextOrder = blocks.length + 1;
      const novoBloco = await createBloco({
        telejornal_id: selectedJournal,
        nome: `Bloco ${nextOrder}`,
        ordem: nextOrder
      });
      
      // Atualizar a UI
      setBlocks([...blocks, { 
        ...novoBloco, 
        items: [],
        totalTime: 0
      }]);
    } catch (error) {
      console.error("Erro ao adicionar bloco:", error);
    }
  };

  const handleAddItem = async (blocoId: string) => {
    setNewItemBlock(blocoId);
    
    try {
      const bloco = blocks.find(b => b.id === blocoId);
      if (!bloco) return;
      
      const nextPage = (bloco.items.length + 1).toString();
      
      const novaMateria = await createMateria({
        bloco_id: blocoId,
        pagina: nextPage,
        retranca: "Nova Matéria",
        clip: "",
        duracao: 0,
        status: "draft",
        reporter: "",
        ordem: bloco.items.length + 1
      });
      
      // Atualizar a UI
      setBlocks(blocks.map(block => {
        if (block.id === blocoId) {
          const updatedItems = [...block.items, novaMateria];
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
          };
        }
        return block;
      }));
      
      setNewItemBlock(null);
    } catch (error) {
      console.error("Erro ao adicionar matéria:", error);
      setNewItemBlock(null);
    }
  };

  const handleItemDoubleClick = (item: Materia) => {
    onEditItem(item);
  };

  const handleEditButtonClick = (item: Materia) => {
    onEditItem(item);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Status color classes
  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = telejornaisQuery.isLoading || blocosQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header com informações do jornal e tempo total */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">
            {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Tempo Total:</p>
          <p className="text-lg font-bold">{formatTime(totalJournalTime)}</p>
        </div>
      </div>

      {/* Área principal com os blocos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Carregando espelho...</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Nenhum bloco encontrado</p>
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className="border border-gray-200 rounded-lg shadow-sm">
              {/* Cabeçalho do bloco */}
              <div className="bg-muted p-3 rounded-t-lg flex justify-between items-center">
                <h2 className="font-bold">{block.nome}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    Tempo: {formatTime(block.totalTime)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleAddItem(block.id)}
                    disabled={newItemBlock === block.id}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Nova Matéria
                  </Button>
                </div>
              </div>

              {/* Tabela de matérias */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4 text-left">Página</th>
                      <th className="py-3 px-4 text-left">Retranca</th>
                      <th className="py-3 px-4 text-left">Clipe</th>
                      <th className="py-3 px-4 text-left">Duração</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Repórter</th>
                      <th className="py-3 px-4 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {block.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-gray-500">
                          Nenhuma matéria neste bloco
                        </td>
                      </tr>
                    ) : (
                      block.items.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-gray-50 transition-colors"
                          onDoubleClick={() => handleItemDoubleClick(item)}
                        >
                          <td className="py-2 px-4">{item.pagina}</td>
                          <td className="py-2 px-4 font-medium">{item.retranca}</td>
                          <td className="py-2 px-4 font-mono text-xs">{item.clip}</td>
                          <td className="py-2 px-4">{formatTime(item.duracao)}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-4">{item.reporter || '-'}</td>
                          <td className="py-2 px-4">
                            <Button size="sm" variant="ghost" onClick={() => handleEditButtonClick(item)}>
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {/* Botão para adicionar novo bloco */}
        {selectedJournal && (
          <div className="flex justify-center">
            <Button 
              variant="outline"
              onClick={handleAddBlock}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Novo Bloco
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
