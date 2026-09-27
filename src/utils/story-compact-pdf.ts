import jsPDF from 'jspdf';
import { drawPdfLogo } from '@/utils/pdf-logo';
import { Telejornal, Materia, Bloco } from '@/types';
import { parseClipTime } from '@/components/news-schedule/utils';
import { formatDate, DATE_FORMATS } from '@/utils/date-utils';

const fmtDur = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const mapTipo = (tipo?: string | null): string => {
  if (!tipo) return '';
  const upper = tipo.toUpperCase();
  const map: Record<string, string> = {
    'VT': 'VT', 'LINK': 'LINK', 'ESCALADA': 'ESCA', 'ESCA': 'ESCA',
    'OFF VIDEO': 'OFFV', 'OFFV': 'OFFV', 'OFF': 'OFFV',
    'PASSAGEM DE BLOCO': 'PB', 'PB': 'PB',
    'ENCERRAMENTO': 'ENCE', 'ENCE': 'ENCE',
    'VHT': 'VHT', 'VINHETA': 'VHT', 'NOTA': 'NOTA',
  };
  return map[upper] || tipo.substring(0, 4).toUpperCase();
};

export const exportStoryCompactPDF = (
  blocks: (Bloco & { items: Materia[] })[],
  telejornal: Telejornal | null
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentW = pageW - margin * 2;
  const leftColW = contentW * 0.38;
  const rightColW = contentW * 0.62;
  const lineH = 4.5;
  let y = margin;

  // Calculate totals for header
  let totalSeconds = 0;
  blocks.forEach(b => b.items.forEach(item => {
    totalSeconds += (item.duracao || 0) + parseClipTime(item.tempo_clip || '');
  }));

  const telejornalName = telejornal?.nome || 'Telejornal';
  const dataStr = telejornal?.created_at
    ? formatDate(telejornal.created_at, DATE_FORMATS.DATE_ONLY)
    : new Date().toLocaleDateString('pt-BR');
  const horario = telejornal?.horario || '00:00:00';

  // ========== PAGE HEADER ==========
  const drawPageHeader = () => {
    y = margin;
    // Header table
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentW, 10, 'FD');
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);

    const hLabels = ['Data:', 'Programa:', 'Início:', 'Fim:', 'Total:'];
    const hValues = [dataStr, telejornalName, horario, '', fmtDur(totalSeconds)];
    const hWidths = [30, 55, 25, 25, 25];
    let hx = margin + 2;
    hLabels.forEach((label, i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, hx, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text(hValues[i], hx, y + 8);
      hx += hWidths[i];
    });

    drawPdfLogo(doc, margin + contentW - 24, y - 11, 22);

    y += 13;
  };

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 18) {
      doc.addPage();
      drawPageHeader();
    }
  };

  drawPageHeader();

  // ========== RENDER MATERIAS ==========
  blocks.forEach(block => {
    block.items.forEach(item => {
      const cab = item.duracao || 0;
      const vt = parseClipTime(item.tempo_clip || '');
      const totalDur = cab + vt;
      const tipo = mapTipo(item.tipo_material);
      const retranca = item.retranca || 'Sem retranca';
      const pagina = item.pagina || '-';
      const reporter = item.reporter || '';
      const cabecaText = item.cabeca || '';
      const gcText = item.gc || '';
      const clipName = item.clip || '';
      const texto = item.texto || '';

      // Pre-calculate right column content
      doc.setFontSize(8);
      const rightTextWidth = rightColW - 6;

      // Build right column lines
      const rightLines: { text: string; bold: boolean }[] = [];

      // Cabeça
      if (cabecaText) {
        const cabLines = doc.splitTextToSize(cabecaText, rightTextWidth);
        cabLines.forEach((l: string) => rightLines.push({ text: l, bold: false }));
        rightLines.push({ text: '', bold: false });
      }

      // Texto
      if (texto) {
        const textoLines = doc.splitTextToSize(texto, rightTextWidth);
        textoLines.forEach((l: string) => rightLines.push({ text: l, bold: false }));
      }

      // Build left column lines
      const leftLines: { text: string; bold: boolean }[] = [];
      leftLines.push({ text: `Duração: ${fmtDur(totalDur)}`, bold: true });
      if (clipName) {
        leftLines.push({ text: '', bold: false });
        leftLines.push({ text: 'Mídias:', bold: true });
        const clipLines = doc.splitTextToSize(`1. ${clipName}`, leftColW - 6);
        clipLines.forEach((l: string) => leftLines.push({ text: l, bold: false }));
      }
      if (gcText) {
        leftLines.push({ text: '', bold: false });
        leftLines.push({ text: 'Créditos:', bold: true });
        const gcLines = doc.splitTextToSize(gcText, leftColW - 6);
        gcLines.forEach((l: string) => leftLines.push({ text: l, bold: false }));
      }

      const maxLines = Math.max(rightLines.length, leftLines.length, 3);
      const blockHeight = maxLines * lineH + 14; // header + content + padding

      checkPage(blockHeight);

      // ---- Materia header bar ----
      doc.setFillColor(50, 50, 50);
      doc.rect(margin, y, contentW, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      const headerText = `${pagina} ${tipo} ${retranca}`;
      doc.text(headerText, margin + 3, y + 5.5);
      if (reporter) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`//${reporter}`, pageW - margin - 3 - doc.getTextWidth(`//${reporter}`), y + 5.5);
      }
      y += 8;

      // ---- Two-column content ----
      const contentStartY = y;
      const contentHeight = maxLines * lineH + 4;

      // Left column border
      doc.setDrawColor(180);
      doc.setLineWidth(0.2);
      doc.rect(margin, contentStartY, leftColW, contentHeight);
      // Right column border
      doc.rect(margin + leftColW, contentStartY, rightColW, contentHeight);

      // Draw left column
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      let ly = contentStartY + lineH + 1;
      leftLines.forEach(line => {
        doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
        doc.text(line.text, margin + 2, ly);
        ly += lineH;
      });

      // Draw right column
      let ry = contentStartY + lineH + 1;
      doc.setFontSize(8);
      rightLines.forEach(line => {
        doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
        doc.text(line.text, margin + leftColW + 3, ry);
        ry += lineH;
      });

      y = contentStartY + contentHeight + 4;
    });
  });

  // ========== FOOTER ==========
  const totalPages = doc.getNumberOfPages();
  const printDate = new Date().toLocaleDateString('pt-BR') + ' ' +
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Data de Impressão: ${printDate}`, margin, pageH - 6);
    doc.text(`Página ${String(i).padStart(2, '0')} de ${String(totalPages).padStart(2, '0')}`, pageW - margin, pageH - 6, { align: 'right' });
  }

  const filename = `rundown_completo_${telejornalName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
