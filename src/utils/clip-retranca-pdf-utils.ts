
import jsPDF from 'jspdf';
import { Materia, Telejornal } from '@/types';

interface BlocoComItems {
  id: string;
  nome: string;
  items: Materia[];
}

export const generateClipRetrancaPDF = (
  blocos: BlocoComItems[],
  telejornal: Telejornal | null
) => {
  const doc = new jsPDF();
  
  // Configurações iniciais
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 6;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Função para adicionar nova página se necessário
  const checkNewPage = (requiredSpace: number = lineHeight * 2) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };
  
  // Título do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titulo = telejornal ? `CLIP + RETRANCA - ${telejornal.nome}` : 'CLIP + RETRANCA';
  doc.text(titulo, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Data e hora atual
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dataAtual = new Date().toLocaleString('pt-BR');
  doc.text(`Gerado em: ${dataAtual}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 1.5;
  
  // Cabeçalho da tabela
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIP', margin, yPosition);
  doc.text('RETRANCA', margin + 60, yPosition);
  yPosition += lineHeight;
  
  // Linha do cabeçalho
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight;
  
  // Iterar pelos blocos
  blocos.forEach((bloco) => {
    if (bloco.items.length === 0) return;
    
    checkNewPage(lineHeight * 3);
    
    // Nome do bloco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`BLOCO: ${bloco.nome.toUpperCase()}`, margin, yPosition);
    yPosition += lineHeight * 1.5;
    
    // Linha separadora do bloco
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight;
    
    // Itens do bloco
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    bloco.items.forEach((item) => {
      checkNewPage();
      
      const clip = item.clip || '-';
      const retranca = item.retranca || '-';
      
      // Quebrar texto longo se necessário
      const clipLines = doc.splitTextToSize(clip, 50);
      const retrancaLines = doc.splitTextToSize(retranca, 120);
      const maxLines = Math.max(clipLines.length, retrancaLines.length);
      
      // Verificar se há espaço para todas as linhas
      checkNewPage(lineHeight * maxLines);
      
      // Desenhar o clip
      doc.text(clipLines, margin, yPosition);
      
      // Desenhar a retranca
      doc.text(retrancaLines, margin + 60, yPosition);
      
      yPosition += lineHeight * maxLines;
      
      // Linha separadora entre itens
      doc.setLineWidth(0.1);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 0.5;
    });
    
    yPosition += lineHeight; // Espaço extra entre blocos
  });
  
  // Rodapé
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
  }
  
  // Gerar nome do arquivo
  const nomeTelejornal = telejornal?.nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'espelho';
  const dataFormatada = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `clip_retranca_${nomeTelejornal}_${dataFormatada}.pdf`;
  
  // Salvar o PDF
  doc.save(filename);
};
