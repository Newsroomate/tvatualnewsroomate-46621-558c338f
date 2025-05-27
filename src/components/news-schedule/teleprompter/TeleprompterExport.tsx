
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Materia, Telejornal } from "@/types";
import jsPDF from 'jspdf';

interface TeleprompterExportProps {
  materias: Materia[];
  telejornal: Telejornal | null;
}

export const TeleprompterExport = ({ materias, telejornal }: TeleprompterExportProps) => {
  const exportToPDF = () => {
    if (!telejornal || !materias.length) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;

    // Sort materias by ordem for proper display order
    const sortedMaterias = [...materias].sort((a, b) => a.ordem - b.ordem);

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
    <Button
      variant="outline"
      size="sm"
      onClick={exportToPDF}
      disabled={!telejornal || !materias.length}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  );
};
