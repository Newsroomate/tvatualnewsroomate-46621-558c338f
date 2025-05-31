
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Telejornal } from "@/types";

interface DualJournalSelectorProps {
  telejornais: Telejornal[];
  primaryJournal: string | null;
  secondaryJournal: string | null;
  onSelectSecondaryJournal: (journalId: string) => void;
  onDeactivateDualView: () => void;
}

export const DualJournalSelector = ({
  telejornais,
  primaryJournal,
  secondaryJournal,
  onSelectSecondaryJournal,
  onDeactivateDualView
}: DualJournalSelectorProps) => {
  const availableJournals = telejornais.filter(tj => tj.id !== primaryJournal);

  return (
    <div className="p-4 bg-yellow-50 border-b border-yellow-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-yellow-800">Modo Visualização Dupla</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDeactivateDualView}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs text-yellow-700">
          Selecione o segundo espelho:
        </div>
        <Select value={secondaryJournal || ""} onValueChange={onSelectSecondaryJournal}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue placeholder="Escolha um telejornal..." />
          </SelectTrigger>
          <SelectContent>
            {availableJournals.map((jornal) => (
              <SelectItem key={jornal.id} value={jornal.id} className="text-xs">
                {jornal.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
