import { useMemo, useState } from "react";
import { Pauta } from "@/types";
import { PautaCard } from "./PautaCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface PautasKanbanProps {
  pautas: Pauta[];
  onEdit: (p: Pauta) => void;
  onDelete: (p: Pauta) => void;
  onStatusChange: (p: Pauta, newStatus: string) => void;
}

const COLUMNS: { id: string; label: string; accent: string }[] = [
  { id: "pendente", label: "Pendente", accent: "border-yellow-500/40" },
  { id: "em_andamento", label: "Em andamento", accent: "border-blue-500/40" },
  { id: "concluida", label: "Concluída", accent: "border-green-500/40" },
];

const normalizeStatus = (s?: string): string => {
  const v = (s || "pendente").toLowerCase();
  if (v.includes("conclu")) return "concluida";
  if (v.includes("andamento") || v.includes("progress")) return "em_andamento";
  return "pendente";
};

export const PautasKanban = ({ pautas, onEdit, onDelete, onStatusChange }: PautasKanbanProps) => {
  const [search, setSearch] = useState("");
  const [reporterFilter, setReporterFilter] = useState<string>("all");
  const [programaFilter, setProgramaFilter] = useState<string>("all");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const reporters = useMemo(
    () => Array.from(new Set(pautas.map((p) => p.reporter).filter(Boolean))) as string[],
    [pautas]
  );
  const programas = useMemo(
    () => Array.from(new Set(pautas.map((p) => p.programa).filter(Boolean))) as string[],
    [pautas]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pautas.filter((p) => {
      if (q && !`${p.titulo} ${p.entrevistado ?? ""} ${p.local ?? ""}`.toLowerCase().includes(q)) return false;
      if (reporterFilter !== "all" && p.reporter !== reporterFilter) return false;
      if (programaFilter !== "all" && p.programa !== programaFilter) return false;
      return true;
    });
  }, [pautas, search, reporterFilter, programaFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, Pauta[]> = { pendente: [], em_andamento: [], concluida: [] };
    for (const p of filtered) g[normalizeStatus(p.status)].push(p);
    return g;
  }, [filtered]);

  const handleDragStart = (e: React.DragEvent, p: Pauta) => {
    e.dataTransfer.setData("text/pauta-id", p.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("text/pauta-id");
    const pauta = pautas.find((p) => p.id === id);
    if (!pauta) return;
    if (normalizeStatus(pauta.status) === colId) return;
    onStatusChange(pauta, colId);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pauta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={reporterFilter} onValueChange={setReporterFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Repórter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os repórteres</SelectItem>
            {reporters.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={programaFilter} onValueChange={setProgramaFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Programa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os programas</SelectItem>
            {programas.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
            onDrop={(e) => handleDrop(e, col.id)}
            className={cn(
              "flex flex-col rounded-lg border-2 bg-muted/30 p-2 min-h-0",
              col.accent,
              dragOverCol === col.id && "bg-muted/60 ring-2 ring-primary"
            )}
          >
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 shrink-0">
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                {grouped[col.id].length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {grouped[col.id].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sem pautas</p>
              ) : (
                grouped[col.id].map((p) => (
                  <PautaCard
                    key={p.id}
                    pauta={p}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    draggable
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
