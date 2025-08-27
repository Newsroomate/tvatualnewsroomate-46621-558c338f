
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 10;
  let yPosition = margin;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - margin * 2;
  
  // Função para criar seção com título escuro e conteúdo
  const createSection = (title: string, content: string, yPos: number) => {
    // Título da seção com fundo escuro
    doc.setFillColor(60, 60, 60);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 8);
    
    // Texto do título em branco
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPos + 5.5);
    
    // Área de conteúdo
    const contentHeight = Math.max(20, Math.ceil(content.length / 90) * 5 + 15);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPos + 8, contentWidth, contentHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, yPos + 8, contentWidth, contentHeight);
    
    // Conteúdo
    if (content && content.trim()) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, contentWidth - 6);
      doc.text(lines, margin + 3, yPos + 15);
    }
    
    return yPos + 8 + contentHeight + 3;
  };

  // CABEÇALHO COM LOGO E CAMPOS
  // Logo NEWS - usando a logo fornecida
  try {
    const logoPath = '/lovable-uploads/51de25cb-c3f7-49cc-8683-bd91fcf5c8e4.png';
    doc.addImage(logoPath, 'PNG', margin, yPosition, 35, 20);
  } catch (error) {
    // Fallback para texto se a imagem não carregar
    doc.setFillColor(0, 102, 204);
    doc.rect(margin, yPosition, 35, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NEWS', margin + 8, yPosition + 13);
  }
  
  // Grid de campos do cabeçalho
  const headerStartX = margin + 40;
  const headerWidth = contentWidth - 40;
  const fieldWidth = headerWidth / 3;
  const fieldHeight = 10;
  
  // Primeira linha: DATA, RETRANCA, PROGRAMA
  const fields1 = [
    { label: 'DATA', content: new Date().toLocaleDateString('pt-BR') },
    { label: 'RETRANCA', content: pauta.titulo || '' },
    { label: 'PROGRAMA', content: 'TELEJORNAL' }
  ];
  
  fields1.forEach((field, index) => {
    const x = headerStartX + (index * fieldWidth);
    
    // Fundo escuro para label
    doc.setFillColor(60, 60, 60);
    doc.rect(x, yPosition, fieldWidth, fieldHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(x, yPosition, fieldWidth, fieldHeight);
    
    // Label
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(field.label, x + 2, yPosition + 6);
    
    // Conteúdo
    doc.setFillColor(255, 255, 255);
    doc.rect(x, yPosition + fieldHeight, fieldWidth, fieldHeight, 'F');
    doc.rect(x, yPosition + fieldHeight, fieldWidth, fieldHeight);
    
    if (field.content) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(field.content, x + 2, yPosition + fieldHeight + 6);
    }
  });
  
  // Segunda linha: PAUTEIROS, REPÓRTER, IMAGENS
  const fields2 = [
    { label: 'PAUTEIROS', content: pauta.produtor || '' },
    { label: 'REPÓRTER', content: '' },
    { label: 'IMAGENS', content: '' }
  ];
  
  fields2.forEach((field, index) => {
    const x = headerStartX + (index * fieldWidth);
    const y = yPosition + (fieldHeight * 2);
    
    // Fundo escuro para label
    doc.setFillColor(60, 60, 60);
    doc.rect(x, y, fieldWidth, fieldHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(x, y, fieldWidth, fieldHeight);
    
    // Label
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(field.label, x + 2, y + 6);
    
    // Conteúdo
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y + fieldHeight, fieldWidth, fieldHeight, 'F');
    doc.rect(x, y + fieldHeight, fieldWidth, fieldHeight);
    
    if (field.content) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(field.content, x + 2, y + fieldHeight + 6);
    }
  });
  
  yPosition += 50;

  // SEÇÕES DE CONTEÚDO
  
  // ROTEIRO 1
  const roteiro = pauta.descricao || pauta.proposta || '*CONTEÚDO AQUI*';
  yPosition = createSection('ROTEIRO 1', roteiro, yPosition);
  
  // ENTREVISTADOS
  const entrevistados = pauta.entrevistado || '*CONTEÚDO AQUI*';
  yPosition = createSection('ENTREVISTADOS', entrevistados, yPosition);
  
  // PROPOSTA
  const proposta = pauta.proposta || '*CONTEÚDO AQUI*';
  yPosition = createSection('PROPOSTA', proposta, yPosition);
  
  // ENCAMINHAMENTO
  const encaminhamento = pauta.encaminhamento || '*CONTEÚDO AQUI*';
  yPosition = createSection('ENCAMINHAMENTO', encaminhamento, yPosition);
  
  // INFORMAÇÕES
  const informacoes = pauta.informacoes || `Local: ${pauta.local || 'N/A'}\nHorário: ${pauta.horario || 'N/A'}`;
  yPosition = createSection('INFORMAÇÕES', informacoes, yPosition);
  
  // Salvar o PDF
  const filename = `pauta_${pauta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
  doc.save(filename);
};
