
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

  // Start directly with the table - no unnecessary header
  yPosition = margin;

  // Create adaptive header table
  const tableStartY = yPosition;
  const tableWidth = pageWidth - margin * 2;
  const baseRowHeight = 12;
  
  // Prepare data for adaptive sizing
  const dataCobertura = pauta.data_cobertura || pauta.horario || '-';
  const retranca = pauta.titulo || '-';
  const programa = '-'; // PROGRAMA field
  const pauteiros = pauta.produtor || '-';
  const reporter = '-'; // REPÓRTER field  
  const imagens = pauta.local || '-'; // IMAGENS field
  
  // Calculate required width for each field based on content independently for each row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  // Function to calculate optimal widths for a row
  const calculateRowWidths = (field1: string, field2: string, field3: string, label1: string, label2: string, label3: string) => {
    const minWidth1 = Math.max(doc.getTextWidth(label1) + 4, doc.getTextWidth(field1) + 8);
    const minWidth2 = Math.max(doc.getTextWidth(label2) + 4, doc.getTextWidth(field2) + 8);
    const minWidth3 = Math.max(doc.getTextWidth(label3) + 4, doc.getTextWidth(field3) + 8);
    
    const totalMinWidth = minWidth1 + minWidth2 + minWidth3;
    
    if (totalMinWidth <= tableWidth) {
      // Distribute remaining space proportionally
      const remainingSpace = tableWidth - totalMinWidth;
      const proportion1 = minWidth1 / totalMinWidth;
      const proportion2 = minWidth2 / totalMinWidth;
      const proportion3 = minWidth3 / totalMinWidth;
      
      return {
        col1: minWidth1 + (remainingSpace * proportion1),
        col2: minWidth2 + (remainingSpace * proportion2),
        col3: minWidth3 + (remainingSpace * proportion3)
      };
    } else {
      // Scale down proportionally
      const scale = tableWidth / totalMinWidth;
      return {
        col1: minWidth1 * scale,
        col2: minWidth2 * scale,
        col3: minWidth3 * scale
      };
    }
  };
  
  // Calculate widths for first row (DATA, RETRANCA, PROGRAMA)
  const firstRowWidths = calculateRowWidths(dataCobertura, retranca, programa, "DATA", "RETRANCA", "PROGRAMA");
  
  // Calculate widths for second row (PAUTEIROS, REPÓRTER, IMAGENS)
  const secondRowWidths = calculateRowWidths(pauteiros, reporter, imagens, "PAUTEIROS", "REPÓRTER", "IMAGENS");
  
  // Calculate required height for each row based on content and column width
  const dataLines = doc.splitTextToSize(dataCobertura, firstRowWidths.col1 - 4);
  const retrancaLines = doc.splitTextToSize(retranca, firstRowWidths.col2 - 4);
  const programaLines = doc.splitTextToSize(programa, firstRowWidths.col3 - 4);
  const firstRowLines = Math.max(dataLines.length, retrancaLines.length, programaLines.length);
  const firstRowHeight = Math.max(baseRowHeight, firstRowLines * 6 + 6);
  
  const pauteirosLines = doc.splitTextToSize(pauteiros, secondRowWidths.col1 - 4);
  const reporterLines = doc.splitTextToSize(reporter, secondRowWidths.col2 - 4);
  const imagensLines = doc.splitTextToSize(imagens, secondRowWidths.col3 - 4);
  const secondRowLines = Math.max(pauteirosLines.length, reporterLines.length, imagensLines.length);
  const secondRowHeight = Math.max(baseRowHeight, secondRowLines * 6 + 6);
  
  // Draw table structure
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  
  // First row - headers with dark background
  doc.setFillColor(60, 60, 60);
  doc.rect(margin, yPosition, tableWidth, baseRowHeight, 'FD');
  
  // First row header text - white text on dark background
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  
  doc.text("DATA", margin + 2, yPosition + 8);
  doc.text("RETRANCA", margin + firstRowWidths.col1 + 2, yPosition + 8);
  doc.text("PROGRAMA", margin + firstRowWidths.col1 + firstRowWidths.col2 + 2, yPosition + 8);
  
  // Draw vertical lines for first row
  doc.line(margin + firstRowWidths.col1, yPosition, margin + firstRowWidths.col1, yPosition + baseRowHeight);
  doc.line(margin + firstRowWidths.col1 + firstRowWidths.col2, yPosition, margin + firstRowWidths.col1 + firstRowWidths.col2, yPosition + baseRowHeight);
  
  yPosition += baseRowHeight;
  
  // First row data - white background with adaptive height
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPosition, tableWidth, firstRowHeight, 'FD');
  
  // First row data text - black text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  // Draw text with line wrapping
  let textY = yPosition + 7;
  dataLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 2, textY + (index * 6));
  });
  
  textY = yPosition + 7;
  retrancaLines.forEach((line: string, index: number) => {
    doc.text(line, margin + firstRowWidths.col1 + 2, textY + (index * 6));
  });
  
  textY = yPosition + 7;
  programaLines.forEach((line: string, index: number) => {
    doc.text(line, margin + firstRowWidths.col1 + firstRowWidths.col2 + 2, textY + (index * 6));
  });
  
  // Draw vertical lines for first data row
  doc.line(margin + firstRowWidths.col1, yPosition, margin + firstRowWidths.col1, yPosition + firstRowHeight);
  doc.line(margin + firstRowWidths.col1 + firstRowWidths.col2, yPosition, margin + firstRowWidths.col1 + firstRowWidths.col2, yPosition + firstRowHeight);
  
  yPosition += firstRowHeight;
  
  // Second row - headers with dark background
  doc.setFillColor(60, 60, 60);
  doc.rect(margin, yPosition, tableWidth, baseRowHeight, 'FD');
  
  // Second row header text - white text on dark background
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  
  doc.text("PAUTEIROS", margin + 2, yPosition + 8);
  doc.text("REPÓRTER", margin + secondRowWidths.col1 + 2, yPosition + 8);
  doc.text("IMAGENS", margin + secondRowWidths.col1 + secondRowWidths.col2 + 2, yPosition + 8);
  
  // Draw vertical lines for second row
  doc.line(margin + secondRowWidths.col1, yPosition, margin + secondRowWidths.col1, yPosition + baseRowHeight);
  doc.line(margin + secondRowWidths.col1 + secondRowWidths.col2, yPosition, margin + secondRowWidths.col1 + secondRowWidths.col2, yPosition + baseRowHeight);
  
  yPosition += baseRowHeight;
  
  // Second row data - white background with adaptive height
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, yPosition, tableWidth, secondRowHeight, 'FD');
  
  // Second row data text - black text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  // Draw text with line wrapping
  textY = yPosition + 7;
  pauteirosLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 2, textY + (index * 6));
  });
  
  textY = yPosition + 7;
  reporterLines.forEach((line: string, index: number) => {
    doc.text(line, margin + secondRowWidths.col1 + 2, textY + (index * 6));
  });
  
  textY = yPosition + 7;
  imagensLines.forEach((line: string, index: number) => {
    doc.text(line, margin + secondRowWidths.col1 + secondRowWidths.col2 + 2, textY + (index * 6));
  });
  
  // Draw vertical lines for second data row
  doc.line(margin + secondRowWidths.col1, yPosition, margin + secondRowWidths.col1, yPosition + secondRowHeight);
  doc.line(margin + secondRowWidths.col1 + secondRowWidths.col2, yPosition, margin + secondRowWidths.col1 + secondRowWidths.col2, yPosition + secondRowHeight);
  
  yPosition += secondRowHeight + lineHeight * 2;

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
