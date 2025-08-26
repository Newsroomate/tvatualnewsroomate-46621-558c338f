
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.width;
  const sectionSpacing = 12;
  
  // Cabeçalho profissional
  doc.setFillColor(41, 128, 185); // Azul profissional
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PAUTA JORNALÍSTICA', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('REDAÇÃO DE TELEVISÃO', pageWidth / 2, 28, { align: 'center' });
  
  // Reset para texto normal
  doc.setTextColor(0, 0, 0);
  yPosition = 50;
  
  // Função auxiliar para criar seções
  const createSection = (title: string, content: string, isLarge = false) => {
    if (!content) return;
    
    // Título da seção com fundo cinza
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 3, pageWidth - margin * 2, 12, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 5, yPosition + 5);
    yPosition += sectionSpacing;
    
    // Conteúdo da seção
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (isLarge) {
      const lines = doc.splitTextToSize(content, pageWidth - margin * 2 - 10);
      doc.text(lines, margin + 5, yPosition);
      yPosition += lineHeight * lines.length + sectionSpacing;
    } else {
      doc.text(content, margin + 5, yPosition);
      yPosition += sectionSpacing;
    }
  };

  // Seção 1: IDENTIFICAÇÃO DA PAUTA
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPosition - 2, pageWidth - margin * 2, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DA PAUTA', margin + 5, yPosition + 5);
  yPosition += 15;
  doc.setTextColor(0, 0, 0);

  createSection('TÍTULO', pauta.titulo);
  createSection('DESCRIÇÃO', pauta.descricao || '', true);

  // Seção 2: DADOS DE PRODUÇÃO
  yPosition += 5;
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPosition - 2, pageWidth - margin * 2, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DADOS DE PRODUÇÃO', margin + 5, yPosition + 5);
  yPosition += 15;
  doc.setTextColor(0, 0, 0);

  createSection('LOCAL', pauta.local || 'Não informado');
  createSection('HORÁRIO', pauta.horario || 'Não informado');
  createSection('ENTREVISTADO(S)', pauta.entrevistado || 'Não informado', true);
  createSection('PRODUTOR RESPONSÁVEL', pauta.produtor || 'Não informado');

  // Seção 3: DESENVOLVIMENTO EDITORIAL
  yPosition += 5;
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPosition - 2, pageWidth - margin * 2, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. DESENVOLVIMENTO EDITORIAL', margin + 5, yPosition + 5);
  yPosition += 15;
  doc.setTextColor(0, 0, 0);

  createSection('PROPOSTA DA MATÉRIA', pauta.proposta || '', true);
  createSection('ENCAMINHAMENTO', pauta.encaminhamento || '', true);
  createSection('INFORMAÇÕES ADICIONAIS', pauta.informacoes || '', true);

  // Rodapé com data
  yPosition += 10;
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  if (pauta.created_at) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const dataFormatada = new Date(pauta.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Pauta criada em: ${dataFormatada}`, margin, yPosition);
  }
  
  // Salvar o PDF
  const filename = `pauta_${pauta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
  doc.save(filename);
};
