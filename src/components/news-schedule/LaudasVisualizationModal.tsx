import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Materia } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LaudasVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  materias: Materia[];
}

export const LaudasVisualizationModal = ({
  isOpen,
  onClose,
  materias
}: LaudasVisualizationModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(materias.length - 1, prev + 1));
  };

  const currentMateria = materias[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visualizar Laudas
          </DialogTitle>
        </DialogHeader>

        {materias.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Nenhuma matéria encontrada no espelho atual.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Navegação e contador */}
            <div className="flex items-center justify-between border-b pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <span className="text-sm font-medium">
                Lauda {currentIndex + 1} de {materias.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === materias.length - 1}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Conteúdo da lauda */}
            {currentMateria && (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 pr-4">
                  {/* Cabeçalho com retranca e badges */}
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{currentMateria.retranca}</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentMateria.tipo_material && (
                        <Badge variant="default">
                          {currentMateria.tipo_material}
                        </Badge>
                      )}
                      {currentMateria.duracao && (
                        <Badge variant="secondary">
                          {Math.floor(currentMateria.duracao / 60)}:{String(currentMateria.duracao % 60).padStart(2, '0')}
                        </Badge>
                      )}
                      {currentMateria.status && (
                        <Badge variant="outline">
                          {currentMateria.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Informações de produção */}
                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    {currentMateria.reporter && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Repórter</label>
                        <p className="text-sm mt-1">{currentMateria.reporter}</p>
                      </div>
                    )}
                    {currentMateria.ordem && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Ordem</label>
                        <p className="text-sm mt-1">{currentMateria.ordem}</p>
                      </div>
                    )}
                    {currentMateria.local_gravacao && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Local</label>
                        <p className="text-sm mt-1">{currentMateria.local_gravacao}</p>
                      </div>
                    )}
                  </div>

                  {/* Cabeça */}
                  {currentMateria.cabeca && (
                    <div className="border-l-4 border-primary pl-4">
                      <label className="text-sm font-semibold text-primary uppercase tracking-wide">Cabeça</label>
                      <p className="text-base mt-2 whitespace-pre-wrap leading-relaxed">
                        {currentMateria.cabeca}
                      </p>
                    </div>
                  )}

                  {/* Texto */}
                  {currentMateria.texto && (
                    <div className="border-l-4 border-secondary pl-4">
                      <label className="text-sm font-semibold text-secondary uppercase tracking-wide">Texto</label>
                      <p className="text-base mt-2 whitespace-pre-wrap leading-relaxed">
                        {currentMateria.texto}
                      </p>
                    </div>
                  )}

                  {/* GC e Informações adicionais */}
                  {(currentMateria.gc || currentMateria.tempo_clip || currentMateria.clip) && (
                    <div className="space-y-3 bg-accent/10 p-4 rounded-lg">
                      {currentMateria.gc && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">GC</label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{currentMateria.gc}</p>
                        </div>
                      )}
                      {currentMateria.tempo_clip && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tempo do Clip</label>
                          <p className="text-sm mt-1">{currentMateria.tempo_clip}</p>
                        </div>
                      )}
                      {currentMateria.clip && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Clip</label>
                          <p className="text-sm mt-1">{currentMateria.clip}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Página */}
                  {currentMateria.pagina && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Página</label>
                      <p className="text-sm mt-1">{currentMateria.pagina}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
