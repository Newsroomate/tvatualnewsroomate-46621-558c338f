
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
  const dataCobertura = pauta.data_cobertura || pauta.horario || new Date().toLocaleDateString('pt-BR');
  doc.text(dataCobertura, xPos, yPosition);
  xPos += colWidths.field1;
  doc.text(pauta.titulo || '-', xPos, yPosition);
  xPos += colWidths.field2;
  doc.text('-', xPos, yPosition); // PROGRAMA field - currently not captured
  
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
  doc.text('-', xPos, yPosition); // REPÓRTER field - currently not captured
  xPos += colWidths.field2;
  doc.text('-', xPos, yPosition); // IMAGENS field - currently not captured
  
  yPosition += lineHeight * 3;

  // Content sections with block styling
  const createContentBlock = (title: string, content: string) => {
    checkNewPage(lineHeight * 8);
    
    // Block background for title
    const blockHeight = 8;
    doc.setFillColor(50, 50, 50); // Dark gray background
    doc.rect(margin, yPosition - 5, pageWidth - margin * 2, blockHeight, 'F');
    
    // Section title in white text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255); // White text
    doc.text(title, margin + 3, yPosition);
    yPosition += lineHeight;
    
    // Reset text color to black
    doc.setTextColor(0, 0, 0);
    
    // Content area with border
    const contentStartY = yPosition;
    yPosition += 3; // Small padding
    
    // Section content
    if (content && content.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const maxWidth = pageWidth - margin * 2 - 6; // Account for padding
      const lines = doc.splitTextToSize(content, maxWidth);
      
      lines.forEach((line: string) => {
        checkNewPage();
        doc.text(line, margin + 3, yPosition);
        yPosition += lineHeight;
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('**CONTEÚDO AQUI**', margin + 3, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += lineHeight;
    }
    
    yPosition += 3; // Bottom padding
    
    // Draw border around content area
    const contentHeight = yPosition - contentStartY;
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.rect(margin, contentStartY, pageWidth - margin * 2, contentHeight);
    
    yPosition += lineHeight; // Space between blocks
  };

  // Add all content sections
  createContentBlock('ROTEIRO 1', pauta.descricao || '');
  createContentBlock('ENTREVISTADOS', pauta.entrevistado || '');
  createContentBlock('PROPOSTA', pauta.proposta || '');
  createContentBlock('ENCAMINHAMENTO', pauta.encaminhamento || '');
  createContentBlock('INFORMAÇÕES', pauta.informacoes || '');
  createContentBlock('IMAGENS', '-'); // Placeholder for images section

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
