
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { FileText, Download } from "lucide-react";
import { Materia, Bloco } from "@/types";
import { exportLaudaRepórter, LaudaExportOptions } from "@/utils/lauda-export-utils";

interface LaudaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaterias: Materia[];
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  telejornalName: string;
}

export const LaudaExportModal = ({
  isOpen,
  onClose,
  selectedMaterias,
  blocks,
  telejornalName
}: LaudaExportModalProps) => {
  const [format, setFormat] = useState<'pdf' | 'txt'>('pdf');
  const [includeCabeca, setIncludeCabeca] = useState(true);
  const [includeTexto, setIncludeTexto] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = () => {
    const options: LaudaExportOptions = {
      format,
      includeCabeca,
      includeTexto,
      includeMetadata
    };

    exportLaudaRepórter(selectedMaterias, blocks, telejornalName, options);
    onClose();
  };

  const isExportDisabled = selectedMaterias.length === 0 || (!includeCabeca && !includeTexto);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exportar Lauda do Repórter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {selectedMaterias.length} matéria(s) selecionada(s) para exportação
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato do arquivo:</Label>
            <RadioGroup value={format} onValueChange={(value: 'pdf' | 'txt') => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF (Recomendado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt">Texto (.txt)</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Conteúdo a incluir:</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cabeca" 
                  checked={includeCabeca}
                  onCheckedChange={setIncludeCabeca}
                />
                <Label htmlFor="cabeca" className="text-sm">Cabeça (Texto do teleprompter)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="texto" 
                  checked={includeTexto}
                  onCheckedChange={setIncludeTexto}
                />
                <Label htmlFor="texto" className="text-sm">Corpo da matéria</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <Label htmlFor="metadata" className="text-sm">Metadados (repórter, duração, clip, página)</Label>
              </div>
            </div>

            {!includeCabeca && !includeTexto && (
              <p className="text-sm text-red-600">
                Selecione pelo menos um tipo de conteúdo para exportar.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExportDisabled}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
