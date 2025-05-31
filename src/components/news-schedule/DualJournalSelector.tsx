
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Split, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTelejornais } from "@/services/api";

interface DualJournalSelectorProps {
  onEnableDualMode: (primaryId: string, secondaryId: string) => void;
  onDisableDualMode: () => void;
  isDualMode: boolean;
  primaryJournalId: string | null;
  secondaryJournalId: string | null;
}

export const DualJournalSelector = ({
  onEnableDualMode,
  onDisableDualMode,
  isDualMode,
  primaryJournalId,
  secondaryJournalId
}: DualJournalSelectorProps) => {
  const [tempPrimary, setTempPrimary] = useState<string>("");
  const [tempSecondary, setTempSecondary] = useState<string>("");

  const { data: telejornais = [] } = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  const handleEnableDualMode = () => {
    if (tempPrimary && tempSecondary && tempPrimary !== tempSecondary) {
      onEnableDualMode(tempPrimary, tempSecondary);
    }
  };

  if (isDualMode) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 border rounded-lg">
        <Split className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-800">Modo Duplo Ativo</span>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onDisableDualMode}
          className="ml-auto"
        >
          <X className="h-4 w-4" />
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 border rounded-lg space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Split className="h-4 w-4" />
        <span className="text-sm font-medium">Visualização Dupla</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Select value={tempPrimary} onValueChange={setTempPrimary}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Telejornal 1" />
          </SelectTrigger>
          <SelectContent>
            {telejornais.map((tj) => (
              <SelectItem key={tj.id} value={tj.id}>
                {tj.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tempSecondary} onValueChange={setTempSecondary}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Telejornal 2" />
          </SelectTrigger>
          <SelectContent>
            {telejornais
              .filter(tj => tj.id !== tempPrimary)
              .map((tj) => (
                <SelectItem key={tj.id} value={tj.id}>
                  {tj.nome}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        size="sm" 
        onClick={handleEnableDualMode}
        disabled={!tempPrimary || !tempSecondary || tempPrimary === tempSecondary}
        className="w-full"
      >
        Ativar Modo Duplo
      </Button>
    </div>
  );
};
