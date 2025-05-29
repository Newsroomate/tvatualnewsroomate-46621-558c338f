
import jsPDF from 'jspdf';
import { Materia, Bloco } from '@/types';
import { formatTime } from '@/components/news-schedule/utils';

export interface LaudaExportOptions {
  format: 'pdf' | 'txt';
  includeCabeca: boolean;
  includeTexto: boolean;
  includeMetadata: boolean;
}

export const exportLaudaRepórter = (
  selectedMaterias: Materia[],
  blocks: (Bloco & { items: Materia[], totalTime: number })[],
  telejornalName: string,
  options: LaudaExportOptions
) => {
  if (options.format === 'pdf') {
    exportLaudaToPDF(selectedMaterias, blocks, telejornalName, options);
  } else {
    exportLaudaToTXT(selectedMaterias, blocks, telejornalName, options);
  }
};

const exportLaudaToPDF = (
  selectedMaterias: Materia[],
  blocks: (Bloco & { items: Materia[], totalTime: number })[],
  telejornalName: string,
  options: LaudaExportOptions
) => {
  const doc = new jsPDF();
  const margin = 20;
  let yPosition = margin;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Cabeçalho do documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDA DO REPÓRTER', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 1.5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${telejornalName} - ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 1.5;

  // Organizar matérias por bloco
  const materiasOrganizadas = organizeMateriasInBlocks(selectedMaterias, blocks);

  materiasOrganizadas.forEach((block, blockIndex) => {
    if (block.items.length === 0) return;

    // Nome do bloco
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`BLOCO ${blockIndex + 1}: ${block.nome.toUpperCase()}`, margin, yPosition);
    yPosition += lineHeight * 1.5;

    block.items.forEach((materia, materiaIndex) => {
      // Verificar se há espaço suficiente para a matéria
      const estimatedHeight = calculateMateriaHeight(materia, options, doc, pageWidth - margin * 2);
      if (yPosition + estimatedHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Número da matéria
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${materiaIndex + 1}. RETRANCA: ${materia.retranca.toUpperCase()}`, margin, yPosition);
      yPosition += lineHeight * 1.2;

      // Metadados
      if (options.includeMetadata) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const metadata = [];
        if (materia.reporter) metadata.push(`Repórter: ${materia.reporter}`);
        if (materia.duracao) metadata.push(`Duração: ${formatTime(materia.duracao)}`);
        if (materia.clip) metadata.push(`Clip: ${materia.clip}`);
        if (materia.pagina) metadata.push(`Página: ${materia.pagina}`);
        
        if (metadata.length > 0) {
          doc.text(metadata.join(' | '), margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 0.5;
      }

      // Cabeça
      if (options.includeCabeca && materia.cabeca) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CABEÇA:', margin, yPosition);
        yPosition += lineHeight;

        doc.setFont('helvetica', 'normal');
        const cabecaLines = doc.splitTextToSize(materia.cabeca, pageWidth - margin * 2);
        doc.text(cabecaLines, margin, yPosition);
        yPosition += lineHeight * cabecaLines.length + lineHeight;
      }

      // Texto/Corpo
      if (options.includeTexto && materia.texto) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TEXTO:', margin, yPosition);
        yPosition += lineHeight;

        doc.setFont('helvetica', 'normal');
        const textoLines = doc.splitTextToSize(materia.texto, pageWidth - margin * 2);
        doc.text(textoLines, margin, yPosition);
        yPosition += lineHeight * textoLines.length + lineHeight * 1.5;
      }

      // Linha separadora entre matérias
      if (materiaIndex < block.items.length - 1) {
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight;
      }
    });

    // Linha separadora entre blocos
    if (blockIndex < materiasOrganizadas.length - 1) {
      yPosition += lineHeight;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 2;
    }
  });

  // Salvar o PDF
  const filename = `lauda_reporter_${telejornalName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

const exportLaudaToTXT = (
  selectedMaterias: Materia[],
  blocks: (Bloco & { items: Materia[], totalTime: number })[],
  telejornalName: string,
  options: LaudaExportOptions
) => {
  let content = '';
  
  // Cabeçalho
  content += '='.repeat(60) + '\n';
  content += `LAUDA DO REPÓRTER\n`;
  content += `${telejornalName} - ${new Date().toLocaleDateString('pt-BR')}\n`;
  content += '='.repeat(60) + '\n\n';

  // Organizar matérias por bloco
  const materiasOrganizadas = organizeMateriasInBlocks(selectedMaterias, blocks);

  materiasOrganizadas.forEach((block, blockIndex) => {
    if (block.items.length === 0) return;

    content += `BLOCO ${blockIndex + 1}: ${block.nome.toUpperCase()}\n`;
    content += '-'.repeat(40) + '\n\n';

    block.items.forEach((materia, materiaIndex) => {
      content += `${materiaIndex + 1}. RETRANCA: ${materia.retranca.toUpperCase()}\n`;

      // Metadados
      if (options.includeMetadata) {
        const metadata = [];
        if (materia.reporter) metadata.push(`Repórter: ${materia.reporter}`);
        if (materia.duracao) metadata.push(`Duração: ${formatTime(materia.duracao)}`);
        if (materia.clip) metadata.push(`Clip: ${materia.clip}`);
        if (materia.pagina) metadata.push(`Página: ${materia.pagina}`);
        
        if (metadata.length > 0) {
          content += metadata.join(' | ') + '\n';
        }
        content += '\n';
      }

      // Cabeça
      if (options.includeCabeca && materia.cabeca) {
        content += 'CABEÇA:\n';
        content += materia.cabeca + '\n\n';
      }

      // Texto
      if (options.includeTexto && materia.texto) {
        content += 'TEXTO:\n';
        content += materia.texto + '\n\n';
      }

      content += '-'.repeat(30) + '\n\n';
    });

    if (blockIndex < materiasOrganizadas.length - 1) {
      content += '\n';
    }
  });

  // Criar e baixar o arquivo TXT
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lauda_reporter_${telejornalName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const organizeMateriasInBlocks = (
  selectedMaterias: Materia[],
  blocks: (Bloco & { items: Materia[], totalTime: number })[]
) => {
  return blocks
    .map(block => ({
      ...block,
      items: block.items.filter(item => 
        selectedMaterias.some(selected => selected.id === item.id)
      )
    }))
    .filter(block => block.items.length > 0);
};

const calculateMateriaHeight = (
  materia: Materia,
  options: LaudaExportOptions,
  doc: jsPDF,
  maxWidth: number
): number => {
  let height = 20; // Base height for title and spacing

  if (options.includeMetadata) {
    height += 15;
  }

  if (options.includeCabeca && materia.cabeca) {
    const cabecaLines = doc.splitTextToSize(materia.cabeca, maxWidth);
    height += cabecaLines.length * 7 + 10;
  }

  if (options.includeTexto && materia.texto) {
    const textoLines = doc.splitTextToSize(materia.texto, maxWidth);
    height += textoLines.length * 7 + 10;
  }

  return height;
};
