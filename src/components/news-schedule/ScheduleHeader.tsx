
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock, PlusCircle, Eye, Download } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal, Materia } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from 'jspdf';

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  onAddBlock?: () => void;
  onViewTeleprompter?: () => void;
  materias?: Materia[];
}

export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks,
  onAddBlock,
  onViewTeleprompter,
  materias = []
}: ScheduleHeaderProps) => {

  const exportToPDF = () => {
    if (!currentTelejornal || !materias.length) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Título do documento
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Espelho - ${currentTelejornal.nome}`, margin, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
    
    yPosition += 20;

    // Ordenar matérias por ordem
    const sortedMaterias = [...materias].sort((a, b) => a.ordem - b.ordem);

    sortedMaterias.forEach((materia, index) => {
      // Verificar se precisa de nova página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      // Retranca em negrito
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${materia.retranca || materia.titulo}`, margin, yPosition);
      yPosition += 8;

      // Cabeça se existir
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
    const fileName = `Espelho_${currentTelejornal.nome}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  return <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold">
          {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
        </h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="flex gap-4 items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddBlock}
          disabled={!currentTelejornal?.espelho_aberto}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Novo Bloco
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewTeleprompter}
          disabled={!currentTelejornal}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar Teleprompter
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportToPDF}
          disabled={!currentTelejornal || !materias.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="outline" size="sm" onClick={onRenumberItems} disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}>
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Reordenar Numeração
                </Button>
              </div>
            </TooltipTrigger>
            {!currentTelejornal?.espelho_aberto && <TooltipContent>
                Abra o espelho para reorganizar a numeração
              </TooltipContent>}
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-right">
          <p className="text-sm font-medium">Tempo Total:</p>
          <p className="text-lg font-bold">{formatTime(totalJournalTime)}</p>
        </div>
      </div>
    </div>;
};
