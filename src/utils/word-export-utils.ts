import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  HeadingLevel,
  PageBreak,
} from "docx";
import { Materia, Pauta, Bloco, Telejornal } from "@/types";
import { gcsToText, GCEntry } from "@/types/gc";
import {
  getOrderedApprovedMaterias,
  getTelejornalName,
  createSafeFilename,
  hasApprovedContent,
} from "@/utils/teleprompter-utils";

// ---------- helpers ----------

const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const MARGIN = 1134; // ~2cm
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

const baseSectionProps = {
  page: {
    size: { width: A4_WIDTH, height: A4_HEIGHT },
    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
  },
};

const docDefaults = {
  default: { document: { run: { font: "Arial", size: 22 } } },
  paragraphStyles: [
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 32, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
    },
    {
      id: "Heading2",
      name: "Heading 2",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 26, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
    },
  ],
};

const timestamp = () =>
  new Date().toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "_");

const saveDoc = async (doc: Document, filename: string) => {
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const textParagraphs = (text: string, opts: { size?: number; bold?: boolean; italics?: boolean } = {}) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map(
      (line) =>
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: line,
              size: opts.size ?? 22,
              bold: opts.bold,
              italics: opts.italics,
            }),
          ],
        })
    );

const sectionBlock = (title: string, content?: string) => [
  new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text: title, bold: true, size: 24 })],
  }),
  ...textParagraphs(content && content.trim() ? content : "Não informado"),
];

const getGCText = (materia: Materia): string => {
  const gcs = (materia as any).gcs as GCEntry[] | undefined;
  if (gcs && Array.isArray(gcs) && gcs.length > 0) {
    const text = gcsToText(gcs);
    if (text.trim()) return text;
  }
  return (materia.gc || "").replace(/\s*\/\s*/g, " | ");
};

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const cell = (text: string, width: number, opts: { bold?: boolean; fill?: string } = {}) =>
  new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || "-", bold: opts.bold, size: 20 })],
      }),
    ],
  });

const generatedAt = () =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        size: 18,
        color: "666666",
      }),
    ],
  });

// ---------- 1. Lauda do repórter ----------

export const exportLaudaToWord = async (materias: Materia[], customFilename?: string) => {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "LAUDA DO REPÓRTER", bold: true, size: 32 })],
    }),
    generatedAt(),
  ];

  materias.forEach((materia, index) => {
    if (index > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(...sectionBlock("RETRANCA:", materia.retranca));
    children.push(...sectionBlock("CABEÇA (TELEPROMPTER):", materia.cabeca));
    children.push(...sectionBlock("GC (GERADOR DE CARACTERES):", getGCText(materia)));
    children.push(...sectionBlock("CORPO DA MATÉRIA:", materia.texto));
    children.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: `Duração: ${materia.duracao || 0}s | Repórter: ${materia.reporter || "Não informado"}`,
            italics: true,
            size: 18,
          }),
        ],
      })
    );
  });

  let filename = customFilename || "Lauda_Reporter";
  if (!customFilename && materias.length > 0 && materias[0].retranca) {
    filename = materias[0].retranca.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").trim();
  }

  const doc = new Document({
    styles: docDefaults,
    sections: [{ properties: baseSectionProps, children }],
  });

  await saveDoc(doc, `${filename}_${timestamp()}.docx`);
};

// ---------- 2. Teleprompter ----------

export const exportTeleprompterToWord = async (
  blocks: (Bloco & { items: Materia[] })[],
  telejornal: Telejornal | null
) => {
  const telejornalName = getTelejornalName(telejornal);
  if (!hasApprovedContent(blocks)) return;

  const orderedMaterias = getOrderedApprovedMaterias(blocks);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "TELEPROMPTER", bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: telejornalName, bold: true, size: 28 })],
    }),
    generatedAt(),
  ];

  if (orderedMaterias.length === 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Nenhuma matéria encontrada para este telejornal", size: 24 })],
      })
    );
  } else {
    orderedMaterias.forEach((materia: any, index: number) => {
      const prev: any = orderedMaterias[index - 1];
      if (index === 0 || prev?.bloco_id !== materia.bloco_id) {
        children.push(
          new Paragraph({
            spacing: { before: 320, after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F6FB2", space: 2 } },
            children: [
              new TextRun({ text: `BLOCO: ${materia.blockName}`, bold: true, size: 26, color: "1F6FB2" }),
            ],
          })
        );
      }

      children.push(
        new Paragraph({
          spacing: { before: 240, after: 100 },
          children: [
            new TextRun({
              text: materia.retranca || `Matéria ${materia.ordem}`,
              bold: true,
              size: 30,
            }),
          ],
        })
      );

      if (materia.cabeca) {
        children.push(...textParagraphs(materia.cabeca, { size: 26 }));
      }
    });
  }

  const doc = new Document({
    styles: docDefaults,
    sections: [{ properties: baseSectionProps, children }],
  });

  await saveDoc(doc, `${createSafeFilename(telejornalName)}.docx`);
};

// ---------- 3. Playout / espelho ----------

export const exportPlayoutWord = async (
  blocks: (Bloco & { items: Materia[] })[],
  telejornal: Telejornal | null
) => {
  if (!telejornal || !blocks.length) return;

  const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
  const widths = [1100, 2200, 2600, CONTENT_WIDTH - 1100 - 2200 - 2600];

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `PLAYOUT - ${telejornal.nome}`, bold: true, size: 32 })],
    }),
    generatedAt(),
  ];

  let materiaCounter = 1;
  let hasAnyItems = false;

  sortedBlocks.forEach((block) => {
    if (!block.items.length) return;
    hasAnyItems = true;

    children.push(
      new Paragraph({
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text: block.nome, bold: true, size: 26 })],
      })
    );

    const rows: TableRow[] = [
      new TableRow({
        children: [
          cell("Pág", widths[0], { bold: true, fill: "E6E6E6" }),
          cell("TIPO", widths[1], { bold: true, fill: "E6E6E6" }),
          cell("REPÓRTER", widths[2], { bold: true, fill: "E6E6E6" }),
          cell("RETRANCA", widths[3], { bold: true, fill: "E6E6E6" }),
        ],
      }),
    ];

    [...block.items]
      .sort((a, b) => a.ordem - b.ordem)
      .forEach((materia) => {
        rows.push(
          new TableRow({
            children: [
              cell(String(materiaCounter++), widths[0]),
              cell(materia.tipo_material || "-", widths[1]),
              cell(materia.reporter || "-", widths[2]),
              cell(materia.retranca || "-", widths[3]),
            ],
          })
        );
      });

    children.push(
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: widths,
        rows,
      })
    );
  });

  if (!hasAnyItems) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Nenhuma matéria encontrada para este telejornal", size: 24 })],
      })
    );
  }

  const doc = new Document({
    styles: docDefaults,
    sections: [{ properties: baseSectionProps, children }],
  });

  await saveDoc(doc, `PLAYOUT_${createSafeFilename(telejornal.nome)}_${timestamp()}.docx`);
};

// ---------- 4. Pauta ----------

const formatBrazilianDate = (dateString?: string) => {
  if (!dateString) return "-";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

export const generatePautaWord = async (pauta: Pauta) => {
  const widths = [
    Math.round(CONTENT_WIDTH * 0.25),
    Math.round(CONTENT_WIDTH * 0.45),
    CONTENT_WIDTH - Math.round(CONTENT_WIDTH * 0.25) - Math.round(CONTENT_WIDTH * 0.45),
  ];

  const headerTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: [
          cell("DATA", widths[0], { bold: true, fill: "E6E6E6" }),
          cell("RETRANCA", widths[1], { bold: true, fill: "E6E6E6" }),
          cell("PROGRAMA", widths[2], { bold: true, fill: "E6E6E6" }),
        ],
      }),
      new TableRow({
        children: [
          cell(formatBrazilianDate(pauta.data_cobertura) || pauta.horario || "-", widths[0]),
          cell(pauta.titulo || "-", widths[1]),
          cell(pauta.programa || "-", widths[2]),
        ],
      }),
      new TableRow({
        children: [
          cell("PAUTEIRO(A)", widths[0], { bold: true, fill: "E6E6E6" }),
          cell("REPÓRTER", widths[1], { bold: true, fill: "E6E6E6" }),
          cell("IMAGENS / LOCAL", widths[2], { bold: true, fill: "E6E6E6" }),
        ],
      }),
      new TableRow({
        children: [
          cell(pauta.produtor || "-", widths[0]),
          cell(pauta.reporter || "-", widths[1]),
          cell(pauta.local || "-", widths[2]),
        ],
      }),
    ],
  });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "PAUTA", bold: true, size: 32 })],
    }),
    generatedAt(),
    headerTable,
    ...sectionBlock("PROPOSTA:", pauta.proposta),
    ...sectionBlock("DESCRIÇÃO:", pauta.descricao),
    ...sectionBlock("ENTREVISTADO(S):", pauta.entrevistado),
    ...sectionBlock("HORÁRIO:", pauta.horario),
    ...sectionBlock("ENCAMINHAMENTO:", pauta.encaminhamento),
    ...sectionBlock("INFORMAÇÕES ADICIONAIS:", pauta.informacoes),
  ];

  const doc = new Document({
    styles: docDefaults,
    sections: [{ properties: baseSectionProps, children }],
  });

  const safeTitle = (pauta.titulo || "Pauta").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").trim();
  await saveDoc(doc, `${safeTitle || "Pauta"}_${timestamp()}.docx`);
};
