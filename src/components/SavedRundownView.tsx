
import { Button } from "@/components/ui/button";
import { SavedRundown } from "@/types/saved-rundowns";
import { formatTime } from "@/components/news-schedule/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDate, DATE_FORMATS } from "@/utils/date-utils";

interface SavedRundownViewProps {
  savedRundown: SavedRundown;
  onClose: () => void;
}

export const SavedRundownView = ({ savedRundown, onClose }: SavedRundownViewProps) => {
  const getStatusClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Garantir que a data seja exibida corretamente
  const displayDate = new Date(savedRundown.data_referencia + 'T00:00:00');

  return (
    <>
      <div className="bg-gray-200 p-2 -mt-4 -mx-4 mb-4 flex justify-between items-center">
        <span className="font-medium text-gray-700">
          Espelho em modo de leitura - {savedRundown.nome} - {format(displayDate, 'dd/MM/yyyy', { locale: ptBR })}
        </span>
        <Button variant="outline" size="sm" onClick={onClose}>
          Voltar
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Informações do Espelho</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-800">
          <div>
            <span className="font-medium">Data de Referência:</span>
            <span className="ml-2">{formatDate(savedRundown.data_referencia, DATE_FORMATS.DATE_ONLY)}</span>
          </div>
          <div>
            <span className="font-medium">Salvo em:</span>
            <span className="ml-2">{formatDate(savedRundown.data_salvamento, DATE_FORMATS.DATE_TIME)}</span>
          </div>
          <div>
            <span className="font-medium">Telejornal:</span>
            <span className="ml-2">{savedRundown.nome}</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-grow">
        {savedRundown.estrutura?.blocos?.length > 0 ? (
          <div className="space-y-6">
            <h3 className="font-medium mb-2">Blocos</h3>
            {savedRundown.estrutura.blocos.map((block) => {
              const totalTime = block.items?.reduce((sum, item) => sum + (item.duracao || 0), 0) || 0;
              
              return (
                <div key={block.id} className="border rounded-md p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">{block.nome}</h4>
                    <span className="text-sm font-medium text-gray-500">
                      Tempo: {formatTime(totalTime)}
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
                        {(!block.items || block.items.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-3 text-center text-gray-500">
                              Nenhuma matéria neste bloco
                            </td>
                          </tr>
                        ) : (
                          block.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-2 px-3">{item.pagina || '-'}</td>
                              <td className="py-2 px-3 font-medium">{item.retranca}</td>
                              <td className="py-2 px-3 font-mono text-xs">{item.clip || '-'}</td>
                              <td className="py-2 px-3">{formatTime(item.duracao || 0)}</td>
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
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-gray-500">Nenhum bloco encontrado neste espelho</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </>
  );
};
