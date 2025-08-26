
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 10;
  let yPosition = margin;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - margin * 2;
  
  // Função para criar caixas com bordas
  const createBox = (x: number, y: number, width: number, height: number, fillColor?: number[]) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    if (fillColor) {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.rect(x, y, width, height, 'FD');
    } else {
      doc.rect(x, y, width, height);
    }
  };

  // Função para adicionar texto em caixa
  const addTextInBox = (text: string, x: number, y: number, width: number, height: number, options: {
    fontSize?: number;
    fontStyle?: string;
    align?: 'left' | 'center' | 'right';
    color?: number[];
    fillColor?: number[];
  } = {}) => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', color = [0, 0, 0], fillColor } = options;
    
    createBox(x, y, width, height, fillColor);
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle as any);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const textY = y + height / 2 + fontSize / 3;
    if (align === 'center') {
      doc.text(text, x + width / 2, textY, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, x + width - 3, textY);
    } else {
      doc.text(text, x + 3, textY);
    }
  };

  // CABEÇALHO COM LOGO
  // Logo NEWS
  doc.setFillColor(23, 87, 174);
  doc.circle(margin + 12, yPosition + 12, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NEWS', margin + 12, yPosition + 16, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Tabela do cabeçalho - estrutura como no modelo
  const headerY = yPosition + 30;
  
  // Primeira linha - labels principais
  const row1Labels = ['DATA', 'RETRANCA', 'PROGRAMA'];
  const row1Values = [
    pauta.created_at ? new Date(pauta.created_at).toLocaleDateString('pt-BR') : '',
    pauta.titulo || '',
    'NEWS'
  ];
  
  // Segunda linha - labels adicionais  
  const row2Labels = ['PAUTEIROS', 'REPÓRTER', 'IMAGENS'];
  const row2Values = [
    pauta.produtor || '',
    pauta.entrevistado || '',
    'ESSENCIAIS'
  ];
  
  // Larguras das colunas
  const col1Width = contentWidth * 0.25;
  const col2Width = contentWidth * 0.4;
  const col3Width = contentWidth * 0.35;
  
  // Primeira linha
  let currentX = margin;
  addTextInBox(row1Labels[0], currentX, headerY, col1Width, 6, { 
    fontSize: 7, 
    fontStyle: 'bold',
    fillColor: [180, 180, 180],
    align: 'center'
  });
  addTextInBox(row1Values[0], currentX, headerY + 6, col1Width, 8, { 
    fontSize: 8,
    align: 'center'
  });
  
  currentX += col1Width;
  addTextInBox(row1Labels[1], currentX, headerY, col2Width, 6, { 
    fontSize: 7, 
    fontStyle: 'bold',
    fillColor: [180, 180, 180],
    align: 'center'
  });
  addTextInBox(row1Values[1], currentX, headerY + 6, col2Width, 8, { 
    fontSize: 8,
    align: 'center'
  });
  
  currentX += col2Width;
  addTextInBox(row1Labels[2], currentX, headerY, col3Width, 6, { 
    fontSize: 7, 
    fontStyle: 'bold',
    fillColor: [180, 180, 180],
    align: 'center'
  });
  addTextInBox(row1Values[2], currentX, headerY + 6, col3Width, 8, { 
    fontSize: 8,
    align: 'center'
  });
  
  // Segunda linha
  currentX = margin;
  addTextInBox(row2Labels[0], currentX, headerY + 14, col1Width, 6, { 
    fontSize: 7, 
    fontStyle: 'bold',
    fillColor: [180, 180, 180],
    align: 'center'
  });
  addTextInBox(row2Values[0], currentX, headerY + 20, col1Width, 8, { 
    fontSize: 8,
    align: 'center'
  });
  
  currentX += col1Width;
  addTextInBox(row2Labels[1], currentX, headerY + 14, col2Width, 6, { 
    fontSize: 7, 
    fontStyle: 'bold',
    fillColor: [180, 180, 180],
    align: 'center'
  });
  addTextInBox(row2Values[1], currentX, headerY + 20, col2Width, 8, { 
    fontSize: 8,
    align: 'center'
  });
  
  currentX += col2Width;
  addTextInBox(row2Labels[2], currentX, headerY + 14, col3Width, 6, { 
    fontSize: 7, 
    fontStyle: 'bold',
    fillColor: [180, 180, 180],
    align: 'center'
  });
  addTextInBox(row2Values[2], currentX, headerY + 20, col3Width, 8, { 
    fontSize: 8,
    align: 'center'
  });
  
  yPosition = headerY + 35;

  // ROTEIRO 1
  addTextInBox('ROTEIRO 1', margin, yPosition, contentWidth, 10, {
    fontSize: 10,
    fontStyle: 'bold',
    fillColor: [50, 50, 50],
    color: [255, 255, 255],
    align: 'left'
  });
  yPosition += 15;

  // DATA DO EVENTO - formato como no modelo
  addTextInBox('DATA DO EVENTO:', margin, yPosition, contentWidth, 8, {
    fontSize: 9,
    fontStyle: 'bold',
    fillColor: [50, 50, 50],
    color: [255, 255, 255]
  });
  
  const eventDate = pauta.created_at ? 
    new Date(pauta.created_at).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }) : 'Não informado';
  
  createBox(margin, yPosition + 8, contentWidth, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(eventDate, margin + 3, yPosition + 16);
  yPosition += 25;

  // LOCAL - formato como no modelo
  addTextInBox('LOCAL:', margin, yPosition, contentWidth, 8, {
    fontSize: 9,
    fontStyle: 'bold',
    fillColor: [50, 50, 50],
    color: [255, 255, 255]
  });
  
  const localInfo = pauta.local || 'Não informado';
  const localLines = doc.splitTextToSize(localInfo, contentWidth - 6);
  const localHeight = Math.max(12, localLines.length * 4 + 8);
  
  createBox(margin, yPosition + 8, contentWidth, localHeight);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(localLines, margin + 3, yPosition + 14);
  yPosition += localHeight + 13;

  // HORÁRIO - formato como no modelo
  addTextInBox('HORÁRIO:', margin, yPosition, contentWidth, 8, {
    fontSize: 9,
    fontStyle: 'bold',
    fillColor: [50, 50, 50],
    color: [255, 255, 255]
  });
  
  createBox(margin, yPosition + 8, contentWidth, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(pauta.horario || 'Não informado', margin + 3, yPosition + 16);
  yPosition += 25;

  // ENTREVISTADOS - formato como no modelo
  if (pauta.entrevistado) {
    addTextInBox('ENTREVISTADOS', margin, yPosition, contentWidth, 8, {
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [50, 50, 50],
      color: [255, 255, 255]
    });
    
    const entrevistadoLines = doc.splitTextToSize(pauta.entrevistado, contentWidth - 6);
    const entrevistadoHeight = Math.max(12, entrevistadoLines.length * 4 + 8);
    
    createBox(margin, yPosition + 8, contentWidth, entrevistadoHeight);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(entrevistadoLines, margin + 3, yPosition + 14);
    yPosition += entrevistadoHeight + 13;
  }

  // PROPOSTA - formato como no modelo
  if (pauta.proposta) {
    addTextInBox('PROPOSTA', margin, yPosition, contentWidth, 8, {
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [50, 50, 50],
      color: [255, 255, 255]
    });
    
    const propostaLines = doc.splitTextToSize(pauta.proposta, contentWidth - 6);
    const propostaHeight = Math.max(20, propostaLines.length * 4 + 8);
    
    createBox(margin, yPosition + 8, contentWidth, propostaHeight);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(propostaLines, margin + 3, yPosition + 14);
    yPosition += propostaHeight + 13;
  }

  // ENCAMINHAMENTO DE PRODUÇÃO - formato como no modelo
  if (pauta.encaminhamento) {
    addTextInBox('ENCAMINHAMENTO DE PRODUÇÃO', margin, yPosition, contentWidth, 8, {
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [50, 50, 50],
      color: [255, 255, 255]
    });
    
    const encaminhamentoLines = doc.splitTextToSize(pauta.encaminhamento, contentWidth - 6);
    const encaminhamentoHeight = Math.max(20, encaminhamentoLines.length * 4 + 8);
    
    createBox(margin, yPosition + 8, contentWidth, encaminhamentoHeight);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(encaminhamentoLines, margin + 3, yPosition + 14);
    yPosition += encaminhamentoHeight + 13;
  }

  // INFORMAÇÕES - formato como no modelo
  if (pauta.informacoes) {
    addTextInBox('INFORMAÇÕES', margin, yPosition, contentWidth, 8, {
      fontSize: 9,
      fontStyle: 'bold',
      fillColor: [50, 50, 50],
      color: [255, 255, 255]
    });
    
    const informacoesLines = doc.splitTextToSize(pauta.informacoes, contentWidth - 6);
    const informacoesHeight = Math.max(20, informacoesLines.length * 4 + 8);
    
    createBox(margin, yPosition + 8, contentWidth, informacoesHeight);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(informacoesLines, margin + 3, yPosition + 14);
    yPosition += informacoesHeight + 13;
  }

  // Produtor no final
  if (pauta.produtor) {
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text(`Produtor: ${pauta.produtor}`, margin, yPosition);
  }
  
  // Salvar o PDF
  const filename = `pauta_${pauta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
  doc.save(filename);
};
