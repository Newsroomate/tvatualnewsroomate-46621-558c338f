
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitorSpeaker, ArrowLeft, BarChart, Search } from "lucide-react";
import { Telejornal } from "@/types";
import { AdvancedSearchModal } from "@/components/search/AdvancedSearchModal";

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onActivateDualView: (secondJournalId: string) => void;
  onDeactivateDualView: () => void;
  onOpenGeneralSchedule: () => void;
}

type MenuSection = 'main' | 'general-schedule' | 'dual-view';

export const MainMenu = ({
  isOpen,
  onClose,
  telejornais,
  selectedJournal,
  onActivateDualView,
  onDeactivateDualView,
  onOpenGeneralSchedule
}: MainMenuProps) => {
  const [currentSection, setCurrentSection] = useState<MenuSection>('main');
  const [selectedSecondJournal, setSelectedSecondJournal] = useState<string>("");
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const handleClose = () => {
    setCurrentSection('main');
    onClose();
  };

  const handleBackToMain = () => {
    setCurrentSection('main');
  };

  const handleActivateDualView = () => {
    if (selectedSecondJournal && selectedJournal) {
      onActivateDualView(selectedSecondJournal);
      handleClose();
    }
  };

  const handleDeactivateDualView = () => {
    onDeactivateDualView();
    handleClose();
  };

  const handleOpenGeneralSchedule = () => {
    onOpenGeneralSchedule();
    handleClose();
  };

  const handleOpenAdvancedSearch = () => {
    setIsAdvancedSearchOpen(true);
    handleClose();
  };

  const availableJournals = telejornais.filter(journal => journal.id !== selectedJournal);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md h-auto max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center">
              {currentSection !== 'main' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="mr-2 p-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {currentSection === 'main' && 'Menu Principal'}
              {currentSection === 'general-schedule' && 'Espelho Geral'}
              {currentSection === 'dual-view' && 'Visualização Dual'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Main Menu */}
            {currentSection === 'main' && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleOpenGeneralSchedule}
                >
                  <BarChart className="h-4 w-4 mr-3" />
                  Espelho Geral
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setCurrentSection('dual-view')}
                >
                  <MonitorSpeaker className="h-4 w-4 mr-3" />
                  Visualização Dual
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleOpenAdvancedSearch}
                >
                  <Search className="h-4 w-4 mr-3" />
                  Busca Avançada de Matérias
                </Button>
              </div>
            )}

            {/* Dual View Section */}
            {currentSection === 'dual-view' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Telejornal secundário:
                  </label>
                  <Select value={selectedSecondJournal} onValueChange={setSelectedSecondJournal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar telejornal" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableJournals.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {journal.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleActivateDualView} 
                    disabled={!selectedSecondJournal}
                    className="flex-1"
                  >
                    Ativar Visualização Dual
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDeactivateDualView}
                    className="flex-1"
                  >
                    Desativar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
      />
    </>
  );
};
