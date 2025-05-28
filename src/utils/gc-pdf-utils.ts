
import jsPDF from 'jspdf';
import { Bloco, Materia, Telejornal } from '@/types';

export const generateGCPDF = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 6;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Função para adicionar nova página se necessário
  const checkPageBreak = (nextContentHeight: number) => {
    if (yPosition + nextContentHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };
  
  // Cabeçalho do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GERADOR DE CARACTERES (GC)', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 1.5;
  
  doc.setFontSize(14);
  doc.text(telejornal.nome, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 1.5;
  
  // Processar cada bloco
  blocks.forEach((bloco, blocoIndex) => {
    // Verificar se há matérias com GC no bloco
    const materiasComGC = bloco.items.filter(materia => materia.gc && materia.gc.trim() !== '');
    
    if (materiasComGC.length === 0) {
      return; // Pular blocos sem GC
    }
    
    // Cabeçalho do bloco
    checkPageBreak(lineHeight * 3);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${bloco.nome}`, margin, yPosition);
    yPosition += lineHeight * 1.5;
    
    // Linha separadora do bloco
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight;
    
    // Processar matérias do bloco
    materiasComGC.forEach((materia, materiaIndex) => {
      // Estimar altura necessária para a matéria
      const retrancaLines = doc.splitTextToSize(materia.retranca || '', pageWidth - margin * 2);
      const gcLines = doc.splitTextToSize(materia.gc || '', pageWidth - margin * 2);
      const estimatedHeight = (retrancaLines.length + gcLines.length + 3) * lineHeight;
      
      checkPageBreak(estimatedHeight);
      
      // Retranca
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('RETRANCA:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(retrancaLines, margin + 35, yPosition);
      yPosition += lineHeight * retrancaLines.length + lineHeight * 0.5;
      
      // GC
      doc.setFont('helvetica', 'bold');
      doc.text('GC:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.text(gcLines, margin + 10, yPosition);
      yPosition += lineHeight * gcLines.length + lineHeight;
      
      // Separador entre matérias
      if (materiaIndex < materiasComGC.length - 1) {
        doc.setLineWidth(0.2);
        doc.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition);
        yPosition += lineHeight;
      }
    });
    
    // Espaço extra entre blocos
    if (blocoIndex < blocks.length - 1) {
      yPosition += lineHeight;
    }
  });
  
  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, pageHeight - 10);
  }
  
  // Salvar o PDF
  const filename = `GC_${telejornal.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
