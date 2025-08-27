
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 30;
  const lineHeight = 8;

  // Function to check if we need a new page
  const checkNewPage = (requiredSpace: number = lineHeight * 3) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Document title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`PAUTA - ${pauta.titulo || 'Nova Pauta'}`, pageWidth / 2, yPosition, { align: 'center' });
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

  // Table headers for main fields
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  
  const colWidths = {
    field1: 60,
    field2: 65,
    field3: 50
  };
  
  let xPos = margin;
  doc.text("DATA", xPos, yPosition);
  xPos += colWidths.field1;
  doc.text("RETRANCA", xPos, yPosition);
  xPos += colWidths.field2;
  doc.text("PROGRAMA", xPos, yPosition);
  
  yPosition += lineHeight;
  
  // Header separator line
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight;

  // First row data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  xPos = margin;
  const dataCobertura = pauta.data_cobertura || pauta.horario || '-';
  doc.text(dataCobertura, xPos, yPosition);
  xPos += colWidths.field1;
  doc.text(pauta.titulo || '-', xPos, yPosition);
  xPos += colWidths.field2;
  doc.text('-', xPos, yPosition); // PROGRAMA field - to be added later
  
  yPosition += lineHeight * 2;

  // Second row headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  
  xPos = margin;
  doc.text("PAUTEIROS", xPos, yPosition);
  xPos += colWidths.field1;
  doc.text("REPÓRTER", xPos, yPosition);
  xPos += colWidths.field2;
  doc.text("IMAGENS", xPos, yPosition);
  
  yPosition += lineHeight;
  
  // Second row separator line
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight;

  // Second row data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  xPos = margin;
  doc.text(pauta.produtor || '-', xPos, yPosition);
  xPos += colWidths.field1;
  doc.text('-', xPos, yPosition); // REPÓRTER field - to be added later
  xPos += colWidths.field2;
  doc.text(pauta.local || '-', xPos, yPosition); // IMAGENS field using local field
  
  yPosition += lineHeight * 3;

  // Content sections - block style like the reference image
  const createContentBlock = (title: string, content: string) => {
    checkNewPage(lineHeight * 8);
    
    // Block header with dark background
    doc.setFillColor(60, 60, 60); // Dark gray background
    doc.rect(margin, yPosition - 3, pageWidth - margin * 2, lineHeight + 2, 'F');
    
    // Block title with white text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255); // White text
    doc.text(title, margin + 3, yPosition + 4);
    yPosition += lineHeight + 2;
    
    // Reset text color to black
    doc.setTextColor(0, 0, 0);
    
    // Content area with border
    const contentHeight = content && content.trim() ? 
      Math.max(lineHeight * 3, doc.splitTextToSize(content, pageWidth - margin * 2 - 6).length * lineHeight + 6) : 
      lineHeight * 3;
    
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, pageWidth - margin * 2, contentHeight);
    
    // Content text
    if (content && content.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const maxWidth = pageWidth - margin * 2 - 6;
      const lines = doc.splitTextToSize(content, maxWidth);
      
      let contentY = yPosition + lineHeight;
      lines.forEach((line: string) => {
        if (contentY + lineHeight > yPosition + contentHeight - 3) return; // Prevent overflow
        doc.text(line, margin + 3, contentY);
        contentY += lineHeight;
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('*CONTEÚDO AQUI*', margin + 3, yPosition + lineHeight * 1.5);
      doc.setTextColor(0, 0, 0);
    }
    
    yPosition += contentHeight + lineHeight;
  };

  // Add all content blocks in the same order as the form
  createContentBlock('ROTEIRO 1', pauta.descricao || '');
  createContentBlock('ENTREVISTADOS', pauta.entrevistado || '');
  createContentBlock('PROPOSTA', pauta.proposta || '');
  createContentBlock('ENCAMINHAMENTO', pauta.encaminhamento || '');
  createContentBlock('INFORMAÇÕES', pauta.informacoes || '');
  createContentBlock('IMAGENS', pauta.local || ''); // Using 'local' field for images

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Generate filename
  const pautaName = (pauta.titulo || 'nova_pauta').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, 'h');
  const filename = `pauta_${pautaName}_${dateFormatted}_${timeFormatted}.pdf`;

  // Save the PDF
  doc.save(filename);
  console.log("Pauta PDF exported:", filename);
};
