
import jsPDF from 'jspdf';
import { Pauta } from '@/types';

export const generatePautaPDF = (pauta: Pauta) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 8;
  const pageWidth = doc.internal.pageSize.width;
  
  // Título do documento
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PAUTA JORNALÍSTICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 1.5;
  
  // Título da pauta
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TÍTULO:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(pauta.titulo, margin + 25, yPosition);
  yPosition += lineHeight * 1.5;
  
  // Descrição
  if (pauta.descricao) {
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIÇÃO:', margin, yPosition);
    yPosition += lineHeight;
    doc.setFont('helvetica', 'normal');
    const descricaoLines = doc.splitTextToSize(pauta.descricao, pageWidth - margin * 2);
    doc.text(descricaoLines, margin, yPosition);
    yPosition += lineHeight * descricaoLines.length + lineHeight;
  }
  
  // Local
  if (pauta.local) {
    doc.setFont('helvetica', 'bold');
    doc.text('LOCAL:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(pauta.local, margin + 25, yPosition);
    yPosition += lineHeight * 1.5;
  }
  
  // Horário
  if (pauta.horario) {
    doc.setFont('helvetica', 'bold');
    doc.text('HORÁRIO:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(pauta.horario, margin + 30, yPosition);
    yPosition += lineHeight * 1.5;
  }
  
  // Entrevistado
  if (pauta.entrevistado) {
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREVISTADO:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(pauta.entrevistado, margin + 45, yPosition);
    yPosition += lineHeight * 1.5;
  }
  
  // Produtor
  if (pauta.produtor) {
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUTOR:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(pauta.produtor, margin + 35, yPosition);
    yPosition += lineHeight * 1.5;
  }
  
  // Data de criação
  if (pauta.created_at) {
    yPosition += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('CRIADO EM:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    const dataFormatada = new Date(pauta.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(dataFormatada, margin + 35, yPosition);
  }
  
  // Salvar o PDF
  const filename = `pauta_${pauta.titulo.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;
  doc.save(filename);
};
