
import jsPDF from 'jspdf';
import { Materia } from '@/types';

export const exportLaudaToPDF = (materias: Materia[], filename: string = 'Lauda_Reporter') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  const bottomMargin = 30; // Margem inferior para evitar cortar texto
  let y = margin;

  // Configurar fonte
  doc.setFont('helvetica');

  // Função para verificar se precisa de nova página e adicionar se necessário
  const checkNewPage = (requiredSpace: number = lineHeight * 2) => {
    if (y + requiredSpace > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar texto com quebra automática de página
  const addTextWithPageBreak = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' | 'italic' = 'normal', maxWidth?: number) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    
    const textWidth = maxWidth || pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(text, textWidth);
    
    for (let i = 0; i < lines.length; i++) {
      // Verificar se precisa de nova página antes de cada linha
      checkNewPage(lineHeight);
      
      doc.text(lines[i], margin, y);
      y += lineHeight;
    }
    
    return lines.length;
  };

  // Função para adicionar seção com título e conteúdo
  const addSection = (title: string, content: string, backgroundColor?: string) => {
    // Verificar espaço para título + pelo menos 2 linhas de conteúdo
    checkNewPage(lineHeight * 4);
    
    // Título da seção
    addTextWithPageBreak(title, 14, 'bold');
    y += 2; // Pequeno espaço após o título
    
    // Conteúdo da seção
    if (content && content.trim()) {
      addTextWithPageBreak(content, 12, 'normal');
    } else {
      addTextWithPageBreak('Não informado', 12, 'normal');
    }
    
    y += 8; // Espaço entre seções
  };

  // Título do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDA DO REPÓRTER', pageWidth / 2, y, { align: 'center' });
  y += lineHeight * 2;

  // Data e hora
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  y += lineHeight * 3;

  materias.forEach((materia, index) => {
    // Separador entre matérias (exceto a primeira)
    if (index > 0) {
      checkNewPage(lineHeight * 6); // Espaço mínimo para começar nova matéria
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += lineHeight * 2;
    }

    // Verificar se há espaço para começar uma nova matéria
    checkNewPage(lineHeight * 8);

    // Retranca
    addSection('RETRANCA:', materia.retranca || 'Não informado');

    // Cabeça (Teleprompter)
    addSection('CABEÇA (TELEPROMPTER):', materia.cabeca || 'Não informado');

    // GC (Gerador de Caracteres)
    addSection('GC (GERADOR DE CARACTERES):', materia.gc || 'Não informado');

    // Corpo da matéria - o mais importante, garantir que todo o texto seja incluído
    addSection('CORPO DA MATÉRIA:', materia.texto || 'Não informado');

    // Informações adicionais em uma linha
    checkNewPage(lineHeight * 3);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const infoText = `Duração: ${materia.duracao || 0}s | Repórter: ${materia.reporter || 'Não informado'}`;
    addTextWithPageBreak(infoText, 10, 'italic');
    
    y += lineHeight; // Espaço extra entre matérias
  });

  // Adicionar numeração de páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
  }

  // Salvar o PDF
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
  doc.save(`${filename}_${timestamp}.pdf`);
};
