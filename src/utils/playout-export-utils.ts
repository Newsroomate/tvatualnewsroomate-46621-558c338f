
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

  // Check if there are any blocks with items  
  const hasAnyItems = sortedBlocks.some(block => block.items.length > 0);
  
  if (!hasAnyItems) {
    doc.setFontSize(14);
    doc.text('Nenhuma matéria encontrada para este telejornal', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    const colWidths = {
      numero: 30,
      tipo: 45,
      reporter: 50,
      retranca: 75
    };

    let materiaCounter = 1; // Contador global de matérias

    // Iterate through each block
    sortedBlocks.forEach((block, blockIndex) => {
      if (block.items.length === 0) return; // Skip empty blocks

      // Block header
      checkNewPage(lineHeight * 4);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${block.nome}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Table headers for this block
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      
      let xPos = margin;
      doc.text("Pág", xPos, yPosition);
      xPos += colWidths.numero;
      doc.text("TIPO", xPos, yPosition);
      xPos += colWidths.tipo;
      doc.text("REPÓRTER", xPos, yPosition);
      xPos += colWidths.reporter;
      doc.text("RETRANCA", xPos, yPosition);
      
      yPosition += lineHeight;
      
      // Header separator line
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

      // Sort materias by ordem within this block
      const sortedMaterias = [...block.items].sort((a, b) => a.ordem - b.ordem);

      // Table content for this block
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      sortedMaterias.forEach((materia) => {
        checkNewPage();

        xPos = margin;
        
        // Página da matéria (número sequencial global)
        doc.text(materiaCounter.toString(), xPos, yPosition);
        materiaCounter++;
        xPos += colWidths.numero;
        
        // Tipo de material
        const tipoMaterial = materia.tipo_material || '-';
        const maxTipoLength = 18;
        const displayTipo = tipoMaterial.length > maxTipoLength 
          ? tipoMaterial.substring(0, maxTipoLength) + '...' 
          : tipoMaterial;
        doc.text(displayTipo, xPos, yPosition);
        xPos += colWidths.tipo;
        
        // Repórter
        const reporter = materia.reporter || '-';
        const maxReporterLength = 22;
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

        yPosition += lineHeight;
      });

      // Add space between blocks (except for the last block)
      if (blockIndex < sortedBlocks.length - 1) {
        yPosition += lineHeight;
      }
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
