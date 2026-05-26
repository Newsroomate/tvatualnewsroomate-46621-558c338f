import { GCType } from "./gc";

export interface GcLayoutLine {
  x: number; // 0-100 %
  y: number; // 0-100 %
  fontSize: number; // px (referente a um canvas 1280x720)
  color: string; // hex
  align: 'left' | 'center' | 'right';
  bold: boolean;
  fontFamily?: string;
}

export interface GcLayout {
  linha1: GcLayoutLine;
  linha2: GcLayoutLine;
}

export type GcMediaType = 'image' | 'video' | null;

export interface GcPacoteGraficoEntry {
  id: string | null;
  telejornal_id: string | null;
  tipo: GCType;
  media_url: string | null;
  media_type: GcMediaType;
  layout: GcLayout;
}

export const DEFAULT_GC_LAYOUT: GcLayout = {
  linha1: { x: 50, y: 70, fontSize: 28, color: '#FFFFFF', align: 'center', bold: true, fontFamily: 'Inter' },
  linha2: { x: 50, y: 82, fontSize: 18, color: '#FFFFFF', align: 'center', bold: false, fontFamily: 'Inter' },
};

export const GC_TIPOS_ORDER: GCType[] = ['credito', 'reporter', 'cinegrafista', 'produtor', 'linha_fina', 'geral'];

export const GC_TIPO_LABELS: Record<GCType, string> = {
  credito: 'Crédito',
  reporter: 'Repórter',
  cinegrafista: 'Cinegrafista',
  produtor: 'Produtor',
  linha_fina: 'Linha Fina',
  geral: 'Geral',
};
