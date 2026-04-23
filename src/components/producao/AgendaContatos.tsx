import { useMemo, useState } from "react";
import { Pauta } from "@/types";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgendaContatosProps {
  pautas: Pauta[];
  onEditPauta: (p: Pauta) => void;
}

interface Contato {
  nome: string;
  pautas: Pauta[];
  reporters: Set<string>;
  produtores: Set<string>;
}

const splitNames = (raw?: string): string[] => {
  if (!raw) return [];
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 80);
};

export const AgendaContatos = ({ pautas, onEditPauta }: AgendaContatosProps) => {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const contatos = useMemo<Contato[]>(() => {
    const map = new Map<string, Contato>();
    for (const p of pautas) {
      const names = splitNames(p.entrevistado);
      for (const n of names) {
        const key = n.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.pautas.push(p);
          if (p.reporter) existing.reporters.add(p.reporter);
          if (p.produtor) existing.produtores.add(p.produtor);
        } else {
          map.set(key, {
            nome: n,
            pautas: [p],
            reporters: new Set(p.reporter ? [p.reporter] : []),
            produtores: new Set(p.produtor ? [p.produtor] : []),
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pautas]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contatos;
    return contatos.filter((c) => c.nome.toLowerCase().includes(q));
  }, [contatos, search]);

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      <div className="relative shrink-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <p className="text-xs text-muted-foreground shrink-0">
        {filtered.length} contato{filtered.length !== 1 ? "s" : ""} extraído{filtered.length !== 1 ? "s" : ""} das pautas existentes
      </p>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum contato encontrado.
          </p>
        ) : (
          filtered.map((c) => {
            const id = c.nome.toLowerCase();
            const isOpen = openId === id;
            return (
              <Card key={id} className="p-3">
                <Collapsible open={isOpen} onOpenChange={(o) => setOpenId(o ? id : null)}>
                  <CollapsibleTrigger className="w-full flex items-center gap-2 text-left">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.nome}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {c.pautas.length} pauta{c.pautas.length !== 1 ? "s" : ""}
                        </Badge>
                        {Array.from(c.reporters).slice(0, 2).map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px]">📹 {r}</Badge>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-1.5 pl-6">
                    {c.pautas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onEditPauta(p)}
                        className="w-full text-left text-xs p-2 rounded bg-muted/40 hover:bg-muted transition-colors"
                      >
                        <div className="font-medium">{p.titulo}</div>
                        {p.data_cobertura && (
                          <div className="text-muted-foreground mt-0.5">{p.data_cobertura}</div>
                        )}
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
