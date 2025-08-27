
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 10;
  let yPosition = margin;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - margin * 2;
  
  // Função para criar células da tabela
  const createTableCell = (x: number, y: number, width: number, height: number, label: string, content: string = '', isHeader: boolean = false) => {
    // Cor de fundo
    if (isHeader) {
      doc.setFillColor(60, 60, 60);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(x, y, width, height, 'F');
    
    // Bordas
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);
    
    // Texto do label (cabeçalho)
    doc.setTextColor(isHeader ? 255 : 0, isHeader ? 255 : 0, isHeader ? 255 : 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const labelY = y + (height / 2) + 2;
    doc.text(label, x + 2, labelY);
    
    // Conteúdo (se houver e não for header)
    if (content && !isHeader) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const contentY = y + height - 3;
      const maxWidth = width - 4;
      const lines = doc.splitTextToSize(content, maxWidth);
      doc.text(lines[0] || '', x + 2, contentY);
    }
  };
  
  // Função para criar seção de conteúdo
  const createContentSection = (y: number, label: string, content: string = '') => {
    const sectionHeight = Math.max(25, Math.ceil((content || '').length / 120) * 8 + 20);
    
    // Cabeçalho da seção (fundo escuro)
    doc.setFillColor(60, 60, 60);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, 12);
    
    // Texto do cabeçalho
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 3, y + 8);
    
    // Área de conteúdo
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y + 12, contentWidth, sectionHeight - 12, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, y + 12, contentWidth, sectionHeight - 12);
    
    // Conteúdo
    if (content) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, contentWidth - 6);
      doc.text(lines, margin + 3, y + 20);
    } else {
      // Placeholder
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('*CONTEÚDO AQUI*', margin + 3, y + 20);
    }
    
    return y + sectionHeight + 3;
  };

  // Início do documento
  yPosition = margin;

  // TABELA SUPERIOR
  const cellHeight = 20;
  const thirdWidth = contentWidth / 3;
  
  // Primeira linha da tabela
  const dataFormatada = pauta.created_at ? 
    new Date(pauta.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : '';
  
  createTableCell(margin, yPosition, thirdWidth, cellHeight, 'DATA', dataFormatada, true);
  createTableCell(margin + thirdWidth, yPosition, thirdWidth, cellHeight, 'RETRANCA', pauta.titulo || '', true);
  createTableCell(margin + (thirdWidth * 2), yPosition, thirdWidth, cellHeight, 'PROGRAMA', '', true);
  
  yPosition += cellHeight;
  
  // Segunda linha da tabela
  createTableCell(margin, yPosition, thirdWidth, cellHeight, 'PAUTEIROS', pauta.produtor || '', true);
  createTableCell(margin + thirdWidth, yPosition, thirdWidth, cellHeight, 'REPÓRTER', '', true);
  createTableCell(margin + (thirdWidth * 2), yPosition, thirdWidth, cellHeight, 'IMAGENS', '', true);
  
  yPosition += cellHeight + 5;

  // SEÇÕES DE CONTEÚDO
  yPosition = createContentSection(yPosition, 'ROTEIRO 1', pauta.descricao);
  yPosition = createContentSection(yPosition, 'ENTREVISTADOS', pauta.entrevistado);
  yPosition = createContentSection(yPosition, 'PROPOSTA', pauta.proposta);
  yPosition = createContentSection(yPosition, 'ENCAMINHAMENTO', pauta.encaminhamento);
  yPosition = createContentSection(yPosition, 'INFORMAÇÕES', pauta.informacoes);
  
  // Salvar o PDF
  const filename = `pauta_${pauta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
  doc.save(filename);
};
