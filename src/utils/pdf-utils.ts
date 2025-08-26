
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
  
  // Tabela do cabeçalho
  const headerY = yPosition + 30;
  const colWidths = [25, 25, 25, 25, 25, 25, 25, 25];
  const colsPerRow = 8;
  const cellWidth = contentWidth / colsPerRow;
  
  // Primeira linha do cabeçalho
  const headerLabels = ['DATA', 'RETRANCA', 'PROGRAMA', '', '', '', '', ''];
  const headerValues = [
    pauta.created_at ? new Date(pauta.created_at).toLocaleDateString('pt-BR') : '',
    pauta.titulo || '',
    'NEWS',
    '', '', '', '', ''
  ];
  
  // Criar células do cabeçalho
  for (let i = 0; i < colsPerRow; i++) {
    const x = margin + (i * cellWidth);
    addTextInBox(headerLabels[i], x, headerY, cellWidth, 8, { 
      fontSize: 8, 
      fontStyle: 'bold',
      fillColor: [200, 200, 200],
      align: 'center'
    });
    addTextInBox(headerValues[i], x, headerY + 8, cellWidth, 8, { 
      fontSize: 8,
      align: 'center'
    });
  }
  
  yPosition = headerY + 25;

  // ROTEIRO 1
  addTextInBox('ROTEIRO 1', margin, yPosition, contentWidth, 12, {
    fontSize: 12,
    fontStyle: 'bold',
    fillColor: [150, 150, 150],
    color: [255, 255, 255]
  });
  yPosition += 15;

  // BLOCO: DATA DO EVENTO
  addTextInBox('DATA DO EVENTO:', margin, yPosition, contentWidth/3, 10, {
    fontSize: 10,
    fontStyle: 'bold',
    fillColor: [100, 100, 100],
    color: [255, 255, 255]
  });
  
  const eventDate = pauta.created_at ? 
    new Date(pauta.created_at).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }) : 'Não informado';
  
  addTextInBox(eventDate, margin, yPosition + 10, contentWidth, 15, {
    fontSize: 10
  });
  yPosition += 30;

  // LOCAL
  addTextInBox('LOCAL:', margin, yPosition, contentWidth, 10, {
    fontSize: 10,
    fontStyle: 'bold',
    fillColor: [100, 100, 100],
    color: [255, 255, 255]
  });
  
  const localInfo = pauta.local || 'Não informado';
  const localLines = doc.splitTextToSize(localInfo, contentWidth - 6);
  const localHeight = Math.max(15, localLines.length * 5 + 10);
  
  createBox(margin, yPosition + 10, contentWidth, localHeight);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(localLines, margin + 3, yPosition + 18);
  yPosition += localHeight + 15;

  // HORÁRIO
  addTextInBox('HORÁRIO:', margin, yPosition, contentWidth, 10, {
    fontSize: 10,
    fontStyle: 'bold',
    fillColor: [100, 100, 100],
    color: [255, 255, 255]
  });
  
  addTextInBox(pauta.horario || 'Não informado', margin, yPosition + 10, contentWidth, 15, {
    fontSize: 10
  });
  yPosition += 30;

  // ENTREVISTADOS
  if (pauta.entrevistado) {
    addTextInBox('ENTREVISTADOS', margin, yPosition, contentWidth, 10, {
      fontSize: 10,
      fontStyle: 'bold',
      fillColor: [100, 100, 100],
      color: [255, 255, 255]
    });
    
    const entrevistadoLines = doc.splitTextToSize(pauta.entrevistado, contentWidth - 6);
    const entrevistadoHeight = Math.max(20, entrevistadoLines.length * 5 + 10);
    
    createBox(margin, yPosition + 10, contentWidth, entrevistadoHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(entrevistadoLines, margin + 3, yPosition + 18);
    yPosition += entrevistadoHeight + 15;
  }

  // PROPOSTA
  if (pauta.proposta) {
    addTextInBox('PROPOSTA', margin, yPosition, contentWidth, 10, {
      fontSize: 10,
      fontStyle: 'bold',
      fillColor: [100, 100, 100],
      color: [255, 255, 255]
    });
    
    const propostaLines = doc.splitTextToSize(pauta.proposta, contentWidth - 6);
    const propostaHeight = Math.max(30, propostaLines.length * 5 + 10);
    
    createBox(margin, yPosition + 10, contentWidth, propostaHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(propostaLines, margin + 3, yPosition + 18);
    yPosition += propostaHeight + 15;
  }

  // ENCAMINHAMENTO DE PRODUÇÃO
  if (pauta.encaminhamento) {
    addTextInBox('ENCAMINHAMENTO DE PRODUÇÃO', margin, yPosition, contentWidth, 10, {
      fontSize: 10,
      fontStyle: 'bold',
      fillColor: [100, 100, 100],
      color: [255, 255, 255]
    });
    
    const encaminhamentoLines = doc.splitTextToSize(pauta.encaminhamento, contentWidth - 6);
    const encaminhamentoHeight = Math.max(30, encaminhamentoLines.length * 5 + 10);
    
    createBox(margin, yPosition + 10, contentWidth, encaminhamentoHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(encaminhamentoLines, margin + 3, yPosition + 18);
    yPosition += encaminhamentoHeight + 15;
  }

  // INFORMAÇÕES
  if (pauta.informacoes) {
    addTextInBox('INFORMAÇÕES', margin, yPosition, contentWidth, 10, {
      fontSize: 10,
      fontStyle: 'bold',
      fillColor: [100, 100, 100],
      color: [255, 255, 255]
    });
    
    const informacoesLines = doc.splitTextToSize(pauta.informacoes, contentWidth - 6);
    const informacoesHeight = Math.max(30, informacoesLines.length * 5 + 10);
    
    createBox(margin, yPosition + 10, contentWidth, informacoesHeight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(informacoesLines, margin + 3, yPosition + 18);
    yPosition += informacoesHeight + 15;
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
