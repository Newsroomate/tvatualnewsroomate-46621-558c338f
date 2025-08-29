
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Materia, Telejornal, Bloco } from "@/types";
import jsPDF from 'jspdf';

interface TeleprompterExportProps {
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const TeleprompterExport = ({ blocks, telejornal }: TeleprompterExportProps) => {
  // Get telejornal name from URL params as fallback
  const getTelejornalName = () => {
    if (telejornal?.nome) return telejornal.nome;
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlTelejornalName = urlParams.get('jornal');
    return urlTelejornalName || 'Telejornal';
  };

  const exportToPDF = () => {
    const telejornalName = getTelejornalName();
    
    if (!blocks.length) {
      console.log("Cannot export PDF: no blocks available");
      return;
    }

    console.log("Starting PDF export with:", { telejornal: telejornalName, blocksCount: blocks.length });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 30;
    const lineHeight = 8;

    // Sort blocks by ordem and then get all materias in the correct order (same logic as TeleprompterContent)
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

    console.log("Ordered materias for PDF:", orderedMaterias.length);

    // Function to check if we need a new page
    const checkNewPage = (requiredSpace: number = lineHeight * 4) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Document title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`TELEPROMPTER`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight;
    
    doc.setFontSize(16);
    doc.text(`${telejornalName}`, pageWidth / 2, yPosition, { align: 'center' });
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
          checkNewPage(lineHeight * 6);
          
          // Block name indicator
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 100, 200); // Blue color
          doc.text(`BLOCO: ${materia.blockName}`, margin, yPosition);
          yPosition += lineHeight * 2;
          
          // Block separator line
          doc.setLineWidth(0.3);
          doc.setTextColor(100, 100, 100); // Gray color
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += lineHeight;
        }

        checkNewPage(lineHeight * 8);

        // Retranca in bold (simulating yellow color with bold text)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0); // Black color for better printing
        const retrancaText = materia.retranca || `Matéria ${materia.ordem}`;
        
        // Split long retranca text if needed
        const maxWidth = pageWidth - (margin * 2);
        const retrancaLines = doc.splitTextToSize(retrancaText, maxWidth);
        
        retrancaLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        
        yPosition += lineHeight * 0.5;

        // Cabeça (head) if exists
        if (materia.cabeca) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0); // Black color
          
          // Split long text into multiple lines
          const cabecaLines = doc.splitTextToSize(materia.cabeca, maxWidth);
          
          // Check if we need a new page for the cabeca
          checkNewPage(lineHeight * cabecaLines.length + lineHeight * 2);
          
          cabecaLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
        }

        // Add spacing between items
        yPosition += lineHeight * 2;

        // Light separator line between items (except for the last one)
        if (index < orderedMaterias.length - 1) {
          doc.setLineWidth(0.1);
          doc.setTextColor(200, 200, 200); // Very light gray
          doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
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
      doc.setTextColor(150, 150, 150); // Gray
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate filename
    const telejornalNameForFile = telejornalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, 'h');
    const filename = `teleprompter_${telejornalNameForFile}_${dateFormatted}_${timeFormatted}.pdf`;

    // Save the PDF
    doc.save(filename);
    console.log("PDF export completed:", filename);
  };

  // Check if export is possible - now using fallback telejornal name
  const telejornalName = getTelejornalName();
  const canExport = telejornalName && blocks.length > 0;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToPDF}
      disabled={!canExport}
      title={!canExport ? "Não há conteúdo para exportar" : "Exportar conteúdo do teleprompter em PDF"}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  );
};
