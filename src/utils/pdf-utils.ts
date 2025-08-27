
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

  // Content sections
  const createContentSection = (title: string, content: string) => {
    checkNewPage(lineHeight * 5);
    
    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin, yPosition);
    yPosition += lineHeight;
    
    // Section separator line
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight;
    
    // Section content
    if (content && content.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const maxWidth = pageWidth - margin * 2;
      const lines = doc.splitTextToSize(content, maxWidth);
      
      lines.forEach((line: string) => {
        checkNewPage();
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('(Nenhuma informação)', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += lineHeight;
    }
    
    yPosition += lineHeight;
  };

  // Add all content sections
  createContentSection('ROTEIRO 1', pauta.descricao || '');
  createContentSection('ENTREVISTADOS', pauta.entrevistado || '');
  createContentSection('PROPOSTA', pauta.proposta || '');
  createContentSection('ENCAMINHAMENTO', pauta.encaminhamento || '');
  createContentSection('INFORMAÇÕES', pauta.informacoes || '');

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
