
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Mock data for news blocks and items
const initialBlocks = [
  {
    id: "b1",
    name: "Bloco 1",
    items: [
      { id: "i1", page: "1", title: "Abertura do Jornal", clip: "ABERTURA_01", duration: 30, status: "published", reporter: "Âncora" },
      { id: "i2", page: "2", title: "Manchetes do Dia", clip: "MANCHETES", duration: 45, status: "published", reporter: "Âncora" }
    ],
    totalTime: 75
  }
];

// Type definitions
interface NewsItem {
  id: string;
  page: string;
  title: string;
  clip: string;
  duration: number;
  status: string;
  reporter?: string;
  approved?: boolean;
  modified?: boolean;
}

interface NewsBlock {
  id: string;
  name: string;
  items: NewsItem[];
  totalTime: number;
}

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (item: any) => void;
}

export const NewsSchedule = ({ selectedJournal, onEditItem }: NewsScheduleProps) => {
  const [blocks, setBlocks] = useState<NewsBlock[]>(initialBlocks);
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);

  // Calculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  const handleAddBlock = () => {
    const newBlockId = `b${blocks.length + 1}`;
    const newBlock: NewsBlock = {
      id: newBlockId,
      name: `Bloco ${blocks.length + 1}`,
      items: [],
      totalTime: 0
    };
    
    setBlocks([...blocks, newBlock]);
  };

  const handleAddItem = (blockId: string) => {
    setNewItemBlock(blockId);
    // Add a new empty item to the specified block
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const newItem: NewsItem = {
          id: `i${Date.now()}`,
          page: `${block.items.length + 1}`,
          title: "Nova Matéria",
          clip: "",
          duration: 0,
          status: "draft"
        };
        
        // Calculate new total time for the block
        const newTotalTime = block.items.reduce((sum, item) => sum + item.duration, 0) + newItem.duration;
        
        return {
          ...block,
          items: [...block.items, newItem],
          totalTime: newTotalTime
        };
      }
      return block;
    }));
  };

  const handleItemDoubleClick = (item: NewsItem) => {
    onEditItem(item);
  };

  const handleEditButtonClick = (item: NewsItem) => {
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
      case 'published': return 'status-published';
      case 'draft': return 'status-draft';
      case 'pending': return 'status-pending';
      case 'urgent': return 'status-urgent';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">
            {selectedJournal ? 
              (selectedJournal === "j1" ? "Jornal da Manhã" : 
               selectedJournal === "j2" ? "Jornal do Meio-Dia" : "Jornal da Noite") : 
              "Selecione um Telejornal"}
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

      {/* Main content area with blocks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {blocks.map((block) => (
          <div key={block.id} className="border border-gray-200 rounded-lg shadow-sm">
            {/* Block header */}
            <div className="bg-muted p-3 rounded-t-lg flex justify-between items-center">
              <h2 className="font-bold">{block.name}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  Tempo: {formatTime(block.totalTime)}
                </span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleAddItem(block.id)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Nova Matéria
                </Button>
              </div>
            </div>

            {/* News items table */}
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
                  {block.items.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 transition-colors"
                      onDoubleClick={() => handleItemDoubleClick(item)}
                    >
                      <td className="py-2 px-4">{item.page}</td>
                      <td className="py-2 px-4 font-medium">{item.title}</td>
                      <td className="py-2 px-4 font-mono text-xs">{item.clip}</td>
                      <td className="py-2 px-4">{formatTime(item.duration)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Add new block button */}
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={handleAddBlock}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Bloco
          </Button>
        </div>
      </div>
    </div>
  );
};
