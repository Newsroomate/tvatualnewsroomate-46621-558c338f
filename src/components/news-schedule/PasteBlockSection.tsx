
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clipboard, X } from "lucide-react";
import { useClipboard } from "@/context/ClipboardContext";
import { formatTime } from "./utils";
import { format } from "date-fns";

interface PasteBlockSectionProps {
  onPasteBlock: () => void;
  isEspelhoOpen: boolean;
}

export const PasteBlockSection = ({ onPasteBlock, isEspelhoOpen }: PasteBlockSectionProps) => {
  const { copiedBlock, clearClipboard, hasClipboardData } = useClipboard();

  if (!hasClipboardData() || !copiedBlock) {
    return null;
  }

  const totalDuration = copiedBlock.materias.reduce((sum, materia) => sum + (materia.duracao || 0), 0);

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clipboard className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">
                Bloco copiado: {copiedBlock.nome}
              </h3>
              <p className="text-sm text-blue-700">
                {copiedBlock.materias.length} matérias • {formatTime(totalDuration)}
                {copiedBlock.source_telejornal && (
                  <span> • De: {copiedBlock.source_telejornal}</span>
                )}
                <span> • Copiado em: {format(new Date(copiedBlock.copied_at), "dd/MM/yyyy HH:mm")}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onPasteBlock}
              disabled={!isEspelhoOpen}
              variant="default"
              size="sm"
            >
              Colar Bloco
            </Button>
            <Button
              onClick={clearClipboard}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
