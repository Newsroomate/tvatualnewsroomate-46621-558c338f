import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Download } from "lucide-react";
import { Materia, Telejornal } from "@/types";
import jsPDF from 'jspdf';

interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  materias: Materia[];
  telejornal: Telejornal | null;
}

export const Teleprompter = ({ isOpen, onClose, materias, telejornal }: TeleprompterProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]); // Speed from 1 to 100
  const [scrollPosition, setScrollPosition] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sort materias by ordem for proper display order
  const sortedMaterias = [...materias].sort((a, b) => a.ordem - b.ordem);

  useEffect(() => {
    if (isPlaying && contentRef.current) {
      const scrollSpeed = speed[0] / 10; // Convert speed to pixels per interval
      
      intervalRef.current = setInterval(() => {
        setScrollPosition(prev => {
          const newPosition = prev + scrollSpeed;
          const maxScroll = contentRef.current?.scrollHeight || 0;
          
          if (newPosition >= maxScroll) {
            setIsPlaying(false);
            return 0; // Reset to top when reaching end
          }
          
          return newPosition;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value);
  };

  const resetPosition = () => {
    setScrollPosition(0);
    setIsPlaying(false);
  };

  const exportToPDF = () => {
    if (!telejornal || !materias.length) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Título do documento
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Teleprompter - ${telejornal.nome}`, margin, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    
    yPosition += 20;

    sortedMaterias.forEach((materia, index) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      // Retranca em negrito (aparece primeiro)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${materia.retranca || materia.titulo}`, margin, yPosition);
      yPosition += 8;

      // Cabeça se existir (aparece depois)
      if (materia.cabeca) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        
        // Quebrar texto longo em múltiplas linhas
        const splitText = doc.splitTextToSize(materia.cabeca, pageWidth - (margin * 2));
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 5;
      }

      yPosition += 10; // Espaço entre matérias
    });

    // Salvar o PDF
    const fileName = `Teleprompter_${telejornal.nome}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Teleprompter - {telejornal?.nome || "Telejornal"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Controls */}
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-600">Velocidade:</span>
            <div className="w-32">
              <Slider
                value={speed}
                onValueChange={handleSpeedChange}
                min={1}
                max={100}
                step={1}
              />
            </div>
            <span className="text-sm text-gray-600">{speed[0]}%</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetPosition}
          >
            Reiniciar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={!telejornal || !materias.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Teleprompter Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto bg-black text-white p-8"
          style={{ 
            fontSize: '24px',
            lineHeight: '1.8',
            scrollBehavior: 'smooth'
          }}
        >
          {sortedMaterias.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              Nenhuma matéria encontrada para este telejornal
            </div>
          ) : (
            <div className="space-y-8">
              {sortedMaterias.map((materia, index) => (
                <div key={materia.id} className="space-y-4">
                  {/* Retranca em amarelo - aparece primeiro */}
                  <div className="text-yellow-400 font-bold text-2xl">
                    {materia.retranca || materia.titulo}
                  </div>
                  
                  {/* Cabeça em branco - aparece depois */}
                  {materia.cabeca && (
                    <div className="text-white font-medium">
                      {materia.cabeca}
                    </div>
                  )}
                  
                  {/* Spacer between items */}
                  {index < sortedMaterias.length - 1 && (
                    <div className="h-8"></div>
                  )}
                </div>
              ))}
              
              {/* Extra space at the end */}
              <div className="h-screen"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
