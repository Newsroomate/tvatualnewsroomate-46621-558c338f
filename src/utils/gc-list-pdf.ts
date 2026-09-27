
import jsPDF from 'jspdf';
import { drawPdfLogo } from '@/utils/pdf-logo';
import { Bloco, Materia, Telejornal, GCEntry } from "@/types";

const typeLabels: Record<string, string> = {
  credito: 'CRÉDITO',
  reporter: 'REPÓRTER',
  linha_fina: 'LINHA FINA',
  geral: 'GERAL',
};

export const exportGCListPDF = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal | null) => {
  if (!telejornal || blocks.length === 0) {
    alert('Não há conteúdo para exportar.');
    return;
  }

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageW = 210;
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 15;

  const checkPage = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 15;
    }
  };

  // Header
  drawPdfLogo(doc, marginL, y - 3, 24);
  const headX = marginL + 28;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`LISTA DE GCs — ${telejornal.nome}`, headX, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}  |  Horário: ${telejornal.horario || '—'}`, headX, y);
  y += 8;

  // Divider
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, marginL + contentW, y);
  y += 6;

  let totalGCs = 0;

  blocks.forEach((bloco, blocoIdx) => {
    const sortedMaterias = [...bloco.items].sort((a, b) => a.ordem - b.ordem);
    const materiasWithGCs = sortedMaterias.filter(m => {
      const gcs = parseGCs(m);
      return gcs.length > 0;
    });

    if (materiasWithGCs.length === 0) return;

    checkPage(12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(230, 230, 230);
    doc.rect(marginL, y - 4, contentW, 7, 'F');
    doc.text(`BLOCO ${blocoIdx + 1}: ${bloco.nome}`, marginL + 2, y);
    y += 8;

    materiasWithGCs.forEach((materia) => {
      const gcs = parseGCs(materia);

      checkPage(10 + gcs.length * 14);
      
      // Materia header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${materia.ordem.toString().padStart(2, '0')}. ${materia.retranca || 'Sem retranca'}`, marginL + 2, y);
      y += 5;

      gcs.forEach((gc, gcIdx) => {
        totalGCs++;
        checkPage(14);

        const typeLabel = typeLabels[gc.tipo] || gc.tipo.toUpperCase();

        // Type badge
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        const badgeW = doc.getTextWidth(typeLabel) + 4;
        doc.setFillColor(gc.tipo === 'credito' ? 200 : gc.tipo === 'reporter' ? 180 : gc.tipo === 'linha_fina' ? 220 : 210,
                          gc.tipo === 'credito' ? 210 : gc.tipo === 'reporter' ? 220 : gc.tipo === 'linha_fina' ? 200 : 210,
                          gc.tipo === 'credito' ? 240 : gc.tipo === 'reporter' ? 190 : gc.tipo === 'linha_fina' ? 170 : 210);
        doc.rect(marginL + 6, y - 3, badgeW, 4, 'F');
        doc.text(typeLabel, marginL + 8, y);
        y += 5;

        // Linha 1
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(gc.linha1 || '', marginL + 10, y);
        y += 5;

        // Linha 2
        if (gc.linha2) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(gc.linha2, marginL + 10, y);
          y += 5;
        }

        y += 2;
      });

      // Thin divider between materias
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(marginL + 4, y, marginL + contentW - 4, y);
      y += 4;
    });

    y += 2;
  });

  // Footer
  checkPage(15);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, marginL + contentW, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de GCs: ${totalGCs}  |  Gerado em: ${new Date().toLocaleString('pt-BR')}`, marginL, y);

  doc.save(`GCs_${telejornal.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

function parseGCs(materia: Materia): GCEntry[] {
  // Prefer structured gcs array
  if (materia.gcs && Array.isArray(materia.gcs) && materia.gcs.length > 0) {
    return materia.gcs as GCEntry[];
  }
  // Fallback: parse the gc text field into entries
  if (materia.gc && materia.gc.trim()) {
    const entries: GCEntry[] = [];
    const lines = materia.gc.split('\n').map(l => l.trim()).filter(Boolean);
    // Group every 2 lines as a GC entry
    for (let i = 0; i < lines.length; i += 2) {
      entries.push({
        tipo: 'geral',
        linha1: lines[i] || '',
        linha2: lines[i + 1] || '',
      });
    }
    return entries;
  }
  return [];
}
