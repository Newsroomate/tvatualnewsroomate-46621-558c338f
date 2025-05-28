
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Materia, Telejornal, Bloco } from "@/types";
import jsPDF from 'jspdf';

interface TeleprompterExportProps {
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const TeleprompterExport = ({ blocks, telejornal }: TeleprompterExportProps) => {
  const exportToPDF = () => {
    if (!telejornal || !blocks.length) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 30;
    const lineHeight = 6;

    // Sort blocks by ordem and then get all materias in the correct order
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    
    // Create a flat list of materias in the correct order
    const orderedMaterias: (Materia & { blockName?: string })[] = [];
    
    sortedBlocks.forEach(block => {
      // Sort materias within each block by ordem
      const sortedMaterias = [...block.items].sort((a, b) => a.ordem - b.ordem);
      
      // Add block name to each materia for context
      sortedMaterias.forEach(materia => {
        orderedMaterias.push({
          ...materia,
          blockName: block.nome
        });
      });
    });

    // Function to check if we need a new page
    const checkNewPage = (requiredSpace: number = lineHeight * 3) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Document title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`TELEPROMPTER - ${telejornal.nome}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;

    // Date and time
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight * 2;

    if (orderedMaterias.length === 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text('Nenhuma matéria encontrada para este telejornal', pageWidth / 2, yPosition, { align: 'center' });
    } else {
      orderedMaterias.forEach((materia, index) => {
        // Check if we need to show block name
        if (index === 0 || orderedMaterias[index - 1]?.bloco_id !== materia.bloco_id) {
          checkNewPage(lineHeight * 4);
          
          // Block name indicator
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 100, 200); // Blue color
          doc.text(`BLOCO: ${materia.blockName}`, margin, yPosition);
          yPosition += lineHeight * 1.5;
          
          // Block separator line
          doc.setLineWidth(0.3);
          doc.setTextColor(0, 0, 0); // Reset to black
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += lineHeight;
        }

        checkNewPage(lineHeight * 6);

        // Retranca in yellow/gold (simulated with bold)
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 150, 0); // Gold color
        const retrancaText = materia.retranca || `Matéria ${materia.ordem}`;
        doc.text(retrancaText, margin, yPosition);
        yPosition += lineHeight * 1.5;

        // Reset color to black
        doc.setTextColor(0, 0, 0);

        // Cabeça (head) if exists
        if (materia.cabeca) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          
          // Split long text into multiple lines
          const maxWidth = pageWidth - (margin * 2);
          const cabecaLines = doc.splitTextToSize(materia.cabeca, maxWidth);
          
          // Check if we need a new page for the cabeca
          checkNewPage(lineHeight * cabecaLines.length + lineHeight);
          
          cabecaLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
        }

        // Add spacing between items
        yPosition += lineHeight * 1.5;

        // Light separator line between items
        if (index < orderedMaterias.length - 1) {
          doc.setLineWidth(0.1);
          doc.setTextColor(150, 150, 150); // Light gray
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          doc.setTextColor(0, 0, 0); // Reset to black
          yPosition += lineHeight;
        }
      });
    }

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100); // Gray
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate filename
    const telejornalName = telejornal.nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `teleprompter_${telejornalName}_${dateFormatted}.pdf`;

    // Save the PDF
    doc.save(filename);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToPDF}
      disabled={!telejornal || !blocks.length}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  );
};
