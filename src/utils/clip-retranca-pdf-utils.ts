
import jsPDF from 'jspdf';
import { Materia, Telejornal, Bloco } from '@/types';

export const exportClipRetrancaPDF = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal | null) => {
  if (!telejornal || !blocks.length) {
    console.log("Cannot export PDF: missing telejornal or blocks");
    return;
  }

  console.log("Starting PLAYOUT PDF export with:", { telejornal: telejornal.nome, blocksCount: blocks.length });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 30;
  const lineHeight = 6;

  // Sort blocks by ordem
  const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);

  // Function to check if we need a new page
  const checkNewPage = (requiredSpace: number = lineHeight * 4) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Document title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`PLAYOUT - ${telejornal.nome}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;

  // Date and time
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const currentDate = new Date().toLocaleString('pt-BR');
  doc.text(`Gerado em: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;

  // Separator line
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 2;

  if (sortedBlocks.length === 0) {
    doc.setFontSize(12);
    doc.text('Nenhum bloco encontrado para este telejornal', pageWidth / 2, yPosition, { align: 'center' });
  } else {
    sortedBlocks.forEach((block, blockIndex) => {
      // Check if we need to show block name
      checkNewPage(lineHeight * 4);
      
      // Block name
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${block.nome}`, margin, yPosition);
      yPosition += lineHeight * 1.5;
      
      // Block separator line
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

      // Sort materias within block by ordem
      const sortedMaterias = [...block.items].sort((a, b) => a.ordem - b.ordem);

      if (sortedMaterias.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text('Nenhuma matéria neste bloco', margin + 10, yPosition);
        yPosition += lineHeight * 2;
      } else {
        sortedMaterias.forEach((materia, materiaIndex) => {
          checkNewPage(lineHeight * 3);

          // Material number and retranca
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          const materiaText = `${materia.ordem}. ${materia.retranca || 'Sem retranca'}`;
          doc.text(materiaText, margin + 10, yPosition);
          yPosition += lineHeight;

          // Clip information
          if (materia.clip) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Clip: ${materia.clip}`, margin + 20, yPosition);
            yPosition += lineHeight;
          }

          // Duration
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const duracao = materia.duracao || 0;
          const minutes = Math.floor(duracao / 60);
          const seconds = duracao % 60;
          const durationText = `Duração: ${minutes}:${seconds.toString().padStart(2, '0')}`;
          doc.text(durationText, margin + 20, yPosition);
          yPosition += lineHeight;

          // Reporter information
          if (materia.reporter) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Repórter: ${materia.reporter}`, margin + 20, yPosition);
            yPosition += lineHeight;
          }

          // Page number
          if (materia.pagina) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Página: ${materia.pagina}`, margin + 20, yPosition);
            yPosition += lineHeight;
          }

          // Add spacing between materials
          yPosition += lineHeight * 0.5;
        });
      }

      // Add spacing between blocks
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
  console.log("PLAYOUT PDF export completed:", filename);
};
