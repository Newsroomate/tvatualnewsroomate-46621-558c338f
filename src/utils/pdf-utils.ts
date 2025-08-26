
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 15;
  let yPosition = margin;
  const lineHeight = 6;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - margin * 2;
  
  // Função para criar caixas de campo
  const createFieldBox = (label: string, content: string, yPos: number, height: number = 15, isMultiLine: boolean = false) => {
    // Caixa do campo
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, contentWidth, height);
    
    // Label em caixa cinza
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    
    // Texto do label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, margin + 3, yPos + 5.5);
    
    // Conteúdo
    if (content && content.trim()) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (isMultiLine) {
        const lines = doc.splitTextToSize(content, contentWidth - 6);
        doc.text(lines, margin + 3, yPos + 12);
      } else {
        doc.text(content, margin + 3, yPos + 12);
      }
    }
    
    return yPos + height + 3;
  };

  // CABEÇALHO PRINCIPAL
  doc.setFillColor(20, 50, 100);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PAUTA JORNALÍSTICA', pageWidth / 2, 16, { align: 'center' });
  
  yPosition = 35;
  doc.setTextColor(0, 0, 0);

  // SEÇÃO 1: IDENTIFICAÇÃO
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPosition, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICAÇÃO DA PAUTA', margin + 5, yPosition + 8);
  yPosition += 18;
  doc.setTextColor(0, 0, 0);

  // Campos da seção 1
  yPosition = createFieldBox('TÍTULO', pauta.titulo, yPosition, 15);
  
  if (pauta.descricao) {
    const descHeight = Math.max(25, Math.ceil(pauta.descricao.length / 80) * 8 + 15);
    yPosition = createFieldBox('DESCRIÇÃO', pauta.descricao, yPosition, descHeight, true);
  }

  // SEÇÃO 2: LOGÍSTICA DE PRODUÇÃO
  yPosition += 5;
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPosition, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGÍSTICA DE PRODUÇÃO', margin + 5, yPosition + 8);
  yPosition += 18;
  doc.setTextColor(0, 0, 0);

  // Campos lado a lado para LOCAL e HORÁRIO
  const halfWidth = (contentWidth - 3) / 2;
  
  // LOCAL (lado esquerdo)
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPosition, halfWidth, 15);
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, yPosition, halfWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('LOCAL', margin + 3, yPosition + 5.5);
  if (pauta.local) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(pauta.local, margin + 3, yPosition + 12);
  }

  // HORÁRIO (lado direito)
  const rightX = margin + halfWidth + 3;
  doc.rect(rightX, yPosition, halfWidth, 15);
  doc.setFillColor(230, 230, 230);
  doc.rect(rightX, yPosition, halfWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('HORÁRIO', rightX + 3, yPosition + 5.5);
  if (pauta.horario) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(pauta.horario, rightX + 3, yPosition + 12);
  }
  
  yPosition += 18;

  // ENTREVISTADO
  if (pauta.entrevistado) {
    const entrevistadoHeight = Math.max(20, Math.ceil(pauta.entrevistado.length / 80) * 6 + 15);
    yPosition = createFieldBox('ENTREVISTADO(S)', pauta.entrevistado, yPosition, entrevistadoHeight, true);
  }

  // PRODUTOR RESPONSÁVEL
  yPosition = createFieldBox('PRODUTOR RESPONSÁVEL', pauta.produtor || 'Não informado', yPosition, 15);

  // SEÇÃO 3: DESENVOLVIMENTO EDITORIAL
  yPosition += 5;
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPosition, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DESENVOLVIMENTO EDITORIAL', margin + 5, yPosition + 8);
  yPosition += 18;
  doc.setTextColor(0, 0, 0);

  // PROPOSTA
  if (pauta.proposta) {
    const propostaHeight = Math.max(30, Math.ceil(pauta.proposta.length / 80) * 6 + 15);
    yPosition = createFieldBox('PROPOSTA DA MATÉRIA', pauta.proposta, yPosition, propostaHeight, true);
  }

  // ENCAMINHAMENTO
  if (pauta.encaminhamento) {
    const encaminhamentoHeight = Math.max(30, Math.ceil(pauta.encaminhamento.length / 80) * 6 + 15);
    yPosition = createFieldBox('ENCAMINHAMENTO', pauta.encaminhamento, yPosition, encaminhamentoHeight, true);
  }

  // INFORMAÇÕES ADICIONAIS
  if (pauta.informacoes) {
    const informacoesHeight = Math.max(30, Math.ceil(pauta.informacoes.length / 80) * 6 + 15);
    yPosition = createFieldBox('INFORMAÇÕES ADICIONAIS', pauta.informacoes, yPosition, informacoesHeight, true);
  }

  // RODAPÉ COM DATA
  yPosition += 10;
  if (pauta.created_at) {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, contentWidth, 12, 'F');
    doc.setDrawColor(100, 100, 100);
    doc.rect(margin, yPosition, contentWidth, 12);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    const dataFormatada = new Date(pauta.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Pauta criada em: ${dataFormatada}`, margin + 5, yPosition + 7.5);
  }
  
  // Salvar o PDF
  const filename = `pauta_${pauta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
  doc.save(filename);
};
