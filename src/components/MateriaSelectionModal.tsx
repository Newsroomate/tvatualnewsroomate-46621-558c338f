
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle2, Circle } from "lucide-react";
import { Materia, Bloco } from "@/types";
import { formatTime } from "@/components/news-schedule/utils";

interface MateriaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  onExportSelected: (selectedMaterias: Materia[]) => void;
}

export const MateriaSelectionModal = ({
  isOpen,
  onClose,
  blocks,
  onExportSelected
}: MateriaSelectionModalProps) => {
  const [selectedMaterias, setSelectedMaterias] = useState<Set<string>>(new Set());

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMaterias(new Set());
    }
  }, [isOpen]);

  const handleMateriaToggle = (materiaId: string) => {
    const newSelected = new Set(selectedMaterias);
    if (newSelected.has(materiaId)) {
      newSelected.delete(materiaId);
    } else {
      newSelected.add(materiaId);
    }
    setSelectedMaterias(newSelected);
  };

  const handleBlockToggle = (block: Bloco & { items: Materia[] }) => {
    const newSelected = new Set(selectedMaterias);
    const blockMateriaIds = block.items.map(item => item.id);
    const allBlockSelected = blockMateriaIds.every(id => newSelected.has(id));

    if (allBlockSelected) {
      // Deselect all items in this block
      blockMateriaIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all items in this block
      blockMateriaIds.forEach(id => newSelected.add(id));
    }
    setSelectedMaterias(newSelected);
  };

  const handleSelectAll = () => {
    const allMateriaIds = blocks.flatMap(block => block.items.map(item => item.id));
    const allSelected = allMateriaIds.every(id => selectedMaterias.has(id));

    if (allSelected) {
      setSelectedMaterias(new Set());
    } else {
      setSelectedMaterias(new Set(allMateriaIds));
    }
  };

  const handleExport = () => {
    const selectedMateriasArray = blocks
      .flatMap(block => block.items)
      .filter(item => selectedMaterias.has(item.id));
    
    onExportSelected(selectedMateriasArray);
  };

  const totalMaterias = blocks.reduce((total, block) => total + block.items.length, 0);
  const allSelected = totalMaterias > 0 && selectedMaterias.size === totalMaterias;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Selecionar Matérias para Exportar
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedMaterias.size} de {totalMaterias} matérias selecionadas
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {allSelected ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Desmarcar Todas
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  Selecionar Todas
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            {blocks.map((block) => {
              if (block.items.length === 0) return null;

              const blockMateriaIds = block.items.map(item => item.id);
              const allBlockSelected = blockMateriaIds.every(id => selectedMaterias.has(id));
              const someBlockSelected = blockMateriaIds.some(id => selectedMaterias.has(id));

              return (
                <div key={block.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allBlockSelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someBlockSelected && !allBlockSelected;
                          }
                        }}
                        onCheckedChange={() => handleBlockToggle(block)}
                      />
                      <h3 className="font-medium">{block.nome}</h3>
                      <Badge variant="secondary">
                        {block.items.length} matérias
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {block.items.map((materia) => (
                      <div key={materia.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                        <Checkbox
                          checked={selectedMaterias.has(materia.id)}
                          onCheckedChange={() => handleMateriaToggle(materia.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{materia.retranca}</span>
                            {materia.clip && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {materia.clip}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {materia.reporter && <span>Rep.: {materia.reporter}</span>}
                            {materia.duracao > 0 && <span>⏱ {formatTime(materia.duracao)}</span>}
                            {materia.pagina && <span>Pág. {materia.pagina}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {blocks.every(block => block.items.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma matéria encontrada nos blocos atuais</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedMaterias.size === 0}
          >
            Continuar ({selectedMaterias.size} selecionadas)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
