
import jsPDF from 'jspdf';
import { Materia } from '@/types';

export const exportLaudaToPDF = (materias: Materia[], filename: string = 'Lauda_Reporter') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const lineHeight = 7;
  let y = margin;

  // Configurar fonte
  doc.setFont('helvetica');

  // Título do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDA DO REPÓRTER', pageWidth / 2, y, { align: 'center' });
  y += lineHeight * 2;

  // Data e hora
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  y += lineHeight * 2;

  materias.forEach((materia, index) => {
    // Verificar se precisa de nova página
    if (y > doc.internal.pageSize.height - 40) {
      doc.addPage();
      y = margin;
    }

    // Separador entre matérias
    if (index > 0) {
      y += lineHeight;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += lineHeight;
    }

    // Retranca
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RETRANCA:', margin, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const retrancaText = materia.retranca || 'Não informado';
    const retrancaLines = doc.splitTextToSize(retrancaText, pageWidth - 2 * margin);
    doc.text(retrancaLines, margin, y);
    y += lineHeight * retrancaLines.length + 5;

    // Cabeça
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CABEÇA (TELEPROMPTER):', margin, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const cabecaText = materia.cabeca || 'Não informado';
    const cabecaLines = doc.splitTextToSize(cabecaText, pageWidth - 2 * margin);
    doc.text(cabecaLines, margin, y);
    y += lineHeight * cabecaLines.length + 5;

    // GC
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GC (GERADOR DE CARACTERES):', margin, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const gcText = materia.gc || 'Não informado';
    const gcLines = doc.splitTextToSize(gcText, pageWidth - 2 * margin);
    doc.text(gcLines, margin, y);
    y += lineHeight * gcLines.length + 5;

    // Corpo da matéria
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CORPO DA MATÉRIA:', margin, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const textoText = materia.texto || 'Não informado';
    const textoLines = doc.splitTextToSize(textoText, pageWidth - 2 * margin);
    doc.text(textoLines, margin, y);
    y += lineHeight * textoLines.length + 10;

    // Informações adicionais
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const infoText = `Duração: ${materia.duracao || 0}s | Repórter: ${materia.reporter || 'Não informado'}`;
    doc.text(infoText, margin, y);
    y += lineHeight * 2;
  });

  // Salvar o PDF
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
  doc.save(`${filename}_${timestamp}.pdf`);
};
