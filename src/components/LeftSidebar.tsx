
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Mock data for journals and news items
const JOURNALS = [
  { id: "j1", name: "Jornal da Manhã" },
  { id: "j2", name: "Jornal do Meio-Dia" },
  { id: "j3", name: "Jornal da Noite" },
];

const NEWS_ITEMS = [
  { id: "n1", title: "Pauta: Inauguração Hospital" },
  { id: "n2", title: "Pauta: Obras na Avenida Principal" },
  { id: "n3", title: "Pauta: Festividades de Fim de Ano" },
];

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
}

export const LeftSidebar = ({ selectedJournal, onSelectJournal }: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);

  const handleOpenGeneralSchedule = () => {
    setIsGeneralScheduleOpen(true);
  };

  return (
    <div className="w-64 bg-gray-100 h-full border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-primary text-primary-foreground">
        <h2 className="text-lg font-semibold">Redação TJ</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Telejornais Section */}
        <div className="p-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Telejornais</h3>
          <ul className="space-y-1">
            {JOURNALS.map((journal) => (
              <li key={journal.id}>
                <Button
                  variant={selectedJournal === journal.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  onClick={() => onSelectJournal(journal.id)}
                >
                  {journal.name}
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Pautas Section */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Pautas</h3>
          <ul className="space-y-1">
            {NEWS_ITEMS.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                >
                  {item.title}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleOpenGeneralSchedule}
        >
          Abrir Espelho Geral
        </Button>
      </div>

      {/* General Schedule Modal (to be implemented) */}
      {isGeneralScheduleOpen && (
        <GeneralScheduleModal onClose={() => setIsGeneralScheduleOpen(false)} />
      )}
    </div>
  );
};

// Placeholder component for the modal
const GeneralScheduleModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Espelho Geral</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Jornal</label>
            <select className="w-full border border-gray-300 rounded-md p-2">
              <option>Jornal da Manhã</option>
              <option>Jornal do Meio-Dia</option>
              <option>Jornal da Noite</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
            <input type="datetime-local" className="w-full border border-gray-300 rounded-md p-2" />
          </div>
        </div>

        <h3 className="font-medium mb-2">Espelhos Fechados</h3>
        <div className="border border-gray-200 rounded-md mb-4">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jornal</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="py-2 px-4">Jornal da Manhã</td>
                <td className="py-2 px-4">20/05/2025</td>
                <td className="py-2 px-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Fechado</span></td>
                <td className="py-2 px-4"><button className="text-secondary hover:text-primary">Visualizar</button></td>
              </tr>
              <tr>
                <td className="py-2 px-4">Jornal do Meio-Dia</td>
                <td className="py-2 px-4">19/05/2025</td>
                <td className="py-2 px-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Fechado</span></td>
                <td className="py-2 px-4"><button className="text-secondary hover:text-primary">Visualizar</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
};
