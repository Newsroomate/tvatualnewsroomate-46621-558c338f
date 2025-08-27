
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 10;
  let yPosition = margin;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - margin * 2;
  
  // Função para criar células da tabela do cabeçalho
  const createHeaderCell = (x: number, y: number, width: number, height: number, label: string, content: string = '') => {
    // Fundo cinza claro para o título
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, width, 12, 'F');
    
    // Fundo branco para o conteúdo
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y + 12, width, height - 12, 'F');
    
    // Bordas
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);
    doc.rect(x, y, width, 12); // Linha separando título do conteúdo
    
    // Texto do título
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 2, y + 8);
    
    // Conteúdo
    if (content) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const maxWidth = width - 4;
      const lines = doc.splitTextToSize(content, maxWidth);
      doc.text(lines, x + 2, y + 18);
    }
  };
  
  // Função para criar seção de conteúdo
  const createContentSection = (y: number, label: string, content: string = '') => {
    const sectionHeight = Math.max(40, Math.ceil((content || '').length / 100) * 6 + 30);
    
    // Cabeçalho da seção (fundo cinza claro)
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, 12);
    
    // Texto do cabeçalho
    doc.setTextColor(0, 0, 0);
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
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, contentWidth - 6);
      doc.text(lines, margin + 3, y + 22);
    }
    
    return y + sectionHeight + 3;
  };

  // Início do documento
  yPosition = margin;

  // TABELA SUPERIOR
  const cellHeight = 30;
  const thirdWidth = contentWidth / 3;
  
  // Data atual de hoje
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Primeira linha da tabela
  createHeaderCell(margin, yPosition, thirdWidth, cellHeight, 'DATA', dataAtual);
  createHeaderCell(margin + thirdWidth, yPosition, thirdWidth, cellHeight, 'RETRANCA', pauta.titulo || '');
  createHeaderCell(margin + (thirdWidth * 2), yPosition, thirdWidth, cellHeight, 'PROGRAMA', '');
  
  yPosition += cellHeight;
  
  // Segunda linha da tabela
  createHeaderCell(margin, yPosition, thirdWidth, cellHeight, 'PAUTEIROS', pauta.produtor || '');
  createHeaderCell(margin + thirdWidth, yPosition, thirdWidth, cellHeight, 'REPÓRTER', '');
  createHeaderCell(margin + (thirdWidth * 2), yPosition, thirdWidth, cellHeight, 'IMAGENS', '');
  
  yPosition += cellHeight + 8;

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
