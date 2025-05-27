
import jsPDF from 'jspdf';
import { Bloco, Materia, Telejornal } from '@/types';

interface EspelhoData {
  blocos: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal;
}

export const generateEspelhoPDF = (data: EspelhoData) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 6;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Função para verificar se precisa de nova página
  const checkNewPage = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  // Cabeçalho do documento
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPELHO DO TELEJORNAL', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Nome do telejornal
  doc.setFontSize(14);
  doc.text(data.telejornal.nome, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight;
  
  // Data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`Data: ${dataFormatada}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 2;
  
  // Processar cada bloco
  data.blocos.forEach((bloco, blocoIndex) => {
    // Verificar espaço para o cabeçalho do bloco
    checkNewPage(25);
    
    // Nome do bloco
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`BLOCO ${blocoIndex + 1}: ${bloco.nome.toUpperCase()}`, margin, yPosition);
    yPosition += lineHeight * 1.5;
    
    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Definir colunas
    const col1X = margin;
    const col2X = margin + 25;
    const col3X = margin + 85;
    
    doc.text('ORD', col1X, yPosition);
    doc.text('CLIPE', col2X, yPosition);
    doc.text('RETRANCA', col3X, yPosition);
    yPosition += lineHeight;
    
    // Linha sob o cabeçalho
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight * 0.5;
    
    // Matérias do bloco
    doc.setFont('helvetica', 'normal');
    
    if (bloco.items.length === 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('(Nenhuma matéria neste bloco)', col1X, yPosition);
      yPosition += lineHeight;
    } else {
      // Ordenar matérias pela ordem
      const materiasOrdenadas = [...bloco.items].sort((a, b) => a.ordem - b.ordem);
      
      materiasOrdenadas.forEach((materia) => {
        // Verificar se precisa de nova página
        checkNewPage();
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Ordem
        doc.text(materia.ordem.toString(), col1X, yPosition);
        
        // Clipe (limitado a ~25 caracteres)
        const clipText = materia.clip || '-';
        const clipTruncated = clipText.length > 25 ? clipText.substring(0, 22) + '...' : clipText;
        doc.text(clipTruncated, col2X, yPosition);
        
        // Retranca (limitado para caber na página)
        const retrancaText = materia.retranca || '-';
        const maxRetrancaWidth = pageWidth - col3X - margin;
        const retrancaLines = doc.splitTextToSize(retrancaText, maxRetrancaWidth);
        
        // Se a retranca tem múltiplas linhas, usar apenas a primeira
        const retrancaDisplay = Array.isArray(retrancaLines) ? retrancaLines[0] : retrancaLines;
        doc.text(retrancaDisplay, col3X, yPosition);
        
        yPosition += lineHeight;
      });
    }
    
    yPosition += lineHeight; // Espaço entre blocos
  });
  
  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Adicionar timestamp
    const timestamp = new Date().toLocaleString('pt-BR');
    doc.text(
      `Gerado em: ${timestamp}`,
      margin,
      pageHeight - 10
    );
  }
  
  // Salvar o PDF
  const filename = `Espelho_${data.telejornal.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${dataFormatada.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};
