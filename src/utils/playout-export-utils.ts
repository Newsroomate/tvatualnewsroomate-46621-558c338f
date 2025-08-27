
import jsPDF from 'jspdf';
import { Materia, Telejornal, Bloco } from '@/types';

export const exportPlayoutPDF = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal | null) => {
  if (!telejornal || !blocks.length) {
    console.log("Cannot export PLAYOUT PDF: missing telejornal or blocks");
    return;
  }

  console.log("Starting PLAYOUT export with:", { telejornal: telejornal.nome, blocksCount: blocks.length });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 30;
  const lineHeight = 8;

  // Sort blocks by ordem
  const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);

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
  doc.text(`PLAYOUT - ${telejornal.nome}`, pageWidth / 2, yPosition, { align: 'center' });
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

  // Collect all materias from all blocks and sort by ordem
  const allMaterias: Materia[] = [];
  sortedBlocks.forEach(block => {
    const sortedMaterias = [...block.items].sort((a, b) => a.ordem - b.ordem);
    allMaterias.push(...sortedMaterias);
  });

  if (allMaterias.length === 0) {
    doc.setFontSize(14);
    doc.text('Nenhuma matéria encontrada para este telejornal', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    // Table headers
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    const colWidths = {
      numero: 20,
      tipo: 30,
      reporter: 35,
      retranca: 40,
      clip: 25
    };
    
    let xPos = margin;
    doc.text("Pág", xPos, yPosition);
    xPos += colWidths.numero;
    doc.text("TIPO", xPos, yPosition);
    xPos += colWidths.tipo;
    doc.text("REPÓRTER", xPos, yPosition);
    xPos += colWidths.reporter;
    doc.text("RETRANCA", xPos, yPosition);
    xPos += colWidths.retranca;
    doc.text("CLIP", xPos, yPosition);
    
    yPosition += lineHeight;
    
    // Header separator line
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight;

    // Table content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    allMaterias.forEach((materia, index) => {
      checkNewPage();

      xPos = margin;
      
      // Página da matéria (ordem)
      doc.text(materia.ordem.toString(), xPos, yPosition);
      xPos += colWidths.numero;
      
      // Tipo de material
      const tipoMaterial = materia.tipo_material || '-';
      const maxTipoLength = 10;
      const displayTipo = tipoMaterial.length > maxTipoLength 
        ? tipoMaterial.substring(0, maxTipoLength) + '...' 
        : tipoMaterial;
      doc.text(displayTipo, xPos, yPosition);
      xPos += colWidths.tipo;
      
      // Repórter
      const reporter = materia.reporter || '-';
      const maxReporterLength = 12;
      const displayReporter = reporter.length > maxReporterLength 
        ? reporter.substring(0, maxReporterLength) + '...' 
        : reporter;
      doc.text(displayReporter, xPos, yPosition);
      xPos += colWidths.reporter;
      
      // Retranca (limitar a 3-4 palavras)
      const retranca = materia.retranca || 'Sem retranca';
      const retrancaWords = retranca.split(' ');
      const displayRetranca = retrancaWords.length > 4 
        ? retrancaWords.slice(0, 4).join(' ') + '...'
        : retranca;
      doc.text(displayRetranca, xPos, yPosition);
      xPos += colWidths.retranca;
      
      // Clip
      const clip = materia.clip || '-';
      const maxClipLength = 8;
      const displayClip = clip.length > maxClipLength 
        ? clip.substring(0, maxClipLength) + '...' 
        : clip;
      doc.text(displayClip, xPos, yPosition);

      yPosition += lineHeight;
    });
  }

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
  const telejornalName = telejornal.nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, 'h');
  const filename = `playout_${telejornalName}_${dateFormatted}_${timeFormatted}.pdf`;

  // Save the PDF
  doc.save(filename);
  console.log("PLAYOUT export completed:", filename);
};
