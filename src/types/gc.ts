export type GCType =
  | 'credito'
  | 'reporter'
  | 'cinegrafista'
  | 'produtor'
  | 'linha_fina'
  | 'geral';

export interface GCEntry {
  id: string;
  tipo: GCType;
  linha1: string;
  linha2: string;
}

export const GC_TYPES: { value: GCType; label: string }[] = [
  { value: 'credito', label: 'Crédito' },
  { value: 'reporter', label: 'Repórter' },
  { value: 'cinegrafista', label: 'Cinegrafista' },
  { value: 'produtor', label: 'Produtor' },
  { value: 'linha_fina', label: 'Linha Fina' },
  { value: 'geral', label: 'Geral' },
];

export const GC_TYPE_COLORS: Record<GCType, string> = {
  credito: 'bg-blue-500',
  reporter: 'bg-emerald-600',
  cinegrafista: 'bg-amber-600',
  produtor: 'bg-purple-600',
  linha_fina: 'bg-rose-600',
  geral: 'bg-slate-600',
};

export const gcsToText = (gcs: GCEntry[] | undefined | null): string => {
  if (!gcs || gcs.length === 0) return '';
  return gcs
    .map((g) => [g.linha1, g.linha2].filter(Boolean).join(' | '))
    .filter(Boolean)
    .join('\n');
};

export const newGCEntry = (tipo: GCType = 'geral', linha1 = '', linha2 = ''): GCEntry => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2),
  tipo,
  linha1,
  linha2,
});
