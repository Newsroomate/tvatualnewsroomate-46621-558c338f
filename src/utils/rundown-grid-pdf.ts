import jsPDF from 'jspdf';
import { drawPdfLogo } from '@/utils/pdf-logo';
import { Telejornal, Materia, Bloco } from '@/types';
import { formatTime, parseClipTime } from '@/components/news-schedule/utils';
import { formatDate, DATE_FORMATS } from '@/utils/date-utils';

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const mapTipoMaterial = (tipo?: string | null): string => {
  if (!tipo) return '-';
  const upper = tipo.toUpperCase();
  const map: Record<string, string> = {
    'VT': 'VT', 'LINK': 'LINK', 'ESCALADA': 'ESCA', 'ESCA': 'ESCA',
    'OFF VIDEO': 'OFFV', 'OFFV': 'OFFV', 'OFF': 'OFFV',
    'PASSAGEM DE BLOCO': 'PB', 'PB': 'PB',
    'ENCERRAMENTO': 'ENCE', 'ENCE': 'ENCE',
    'VHT': 'VHT', 'VINHETA': 'VHT', 'NOTA': 'NOTA',
    'NOTA COBERTA': 'NC', 'NC': 'NC',
    'AO VIVO': 'AV', 'BOLETIM': 'BOL',
  };
  return map[upper] || tipo.substring(0, 4).toUpperCase();
};

export const exportRundownGridPDF = (
  blocks: (Bloco & { items: Materia[] })[],
  telejornal: Telejornal | null
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentW = pageW - margin * 2;
  let y = margin;

  const colWidths = [12, 14, 80, 20, 22, 28, 14, 14, 16, 16, 16, 16]; // ~268mm total for landscape
  const scale = contentW / colWidths.reduce((a, b) => a + b, 0);
  const cols = colWidths.map(w => w * scale);
  const headers = ['Pág.', 'Tipo', 'Retranca', 'Mídias', 'Editor', 'Repórter', 'Link', 'Cab.', 'VT', 'Total', 'OK', 'Apr'];
  const rowH = 6;

  // Calculate totals
  let totalCabAll = 0, totalVtAll = 0, totalAll = 0;
  blocks.forEach(block => {
    block.items.forEach(item => {
      const cab = item.duracao || 0;
      const vt = parseClipTime(item.tempo_clip || '');
      totalCabAll += cab;
      totalVtAll += vt;
      totalAll += cab + vt;
    });
  });

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 15) {
      doc.addPage();
      y = margin;
    }
  };

  // ========== HEADER ==========
  const telejornalName = telejornal?.nome || 'Telejornal';
  const dataStr = telejornal?.created_at
    ? formatDate(telejornal.created_at, DATE_FORMATS.DATE_ONLY)
    : new Date().toLocaleDateString('pt-BR');
  const horario = telejornal?.horario || '';

  drawPdfLogo(doc, margin, y, 26);
  const titleX = margin + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(telejornalName.toUpperCase(), titleX, y + 6);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const infoItems = [
    `Data: ${dataStr}`,
    horario ? `Início: ${horario}` : '',
    `Total: ${formatDuration(totalAll)}`,
  ].filter(Boolean);
  doc.text(infoItems.join('    '), titleX, y + 4);
  y += 8;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 3;

  // Helper to draw a row
  const drawRow = (values: string[], bold = false, bgColor?: [number, number, number]) => {
    checkPage(rowH + 2);
    let x = margin;
    if (bgColor) {
      doc.setFillColor(...bgColor);
      doc.rect(margin, y, contentW, rowH, 'F');
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    values.forEach((val, i) => {
      const cellW = cols[i];
      const truncated = doc.splitTextToSize(val, cellW - 2)[0] || '';
      doc.text(truncated, x + 1, y + 4.2);
      x += cellW;
    });
    // Draw cell borders
    x = margin;
    doc.setDrawColor(180);
    doc.setLineWidth(0.2);
    cols.forEach(w => {
      doc.rect(x, y, w, rowH);
      x += w;
    });
    y += rowH;
  };

  // ========== BLOCKS ==========
  blocks.forEach((block, blockIdx) => {
    checkPage(rowH * 3);

    // Block header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Bloco ${String(blockIdx + 1).padStart(2, '0')}`, margin, y + 4);
    y += 7;

    // Table header
    drawRow(headers, true, [230, 230, 230]);

    // Items
    let blockCab = 0, blockVt = 0, blockTotal = 0;
    block.items.forEach(item => {
      const cab = item.duracao || 0;
      const vt = parseClipTime(item.tempo_clip || '');
      const total = cab + vt;
      blockCab += cab;
      blockVt += vt;
      blockTotal += total;

      drawRow([
        item.pagina || '-',
        mapTipoMaterial(item.tipo_material),
        item.retranca || 'Sem retranca',
        item.clip || '',
        '',
        item.reporter || '',
        '',
        formatDuration(cab),
        formatDuration(vt),
        formatDuration(total),
        formatDuration(vt),
        formatDuration(total),
      ]);
    });

    // Block total
    drawRow([
      '', '', '', '', '', '', '', '',
      `Total do Bloco:`,
      formatDuration(blockCab),
      formatDuration(blockVt),
      formatDuration(blockTotal),
    ], true, [245, 245, 245]);

    y += 4;
  });

  // ========== GRAND TOTAL ==========
  checkPage(rowH + 4);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 2;
  drawRow([
    '', '', '', '', '', '', '', '',
    'Total do Espelho:',
    formatDuration(totalCabAll),
    formatDuration(totalVtAll),
    formatDuration(totalAll),
  ], true, [220, 220, 220]);

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

  const filename = `rundown_grade_${telejornalName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
