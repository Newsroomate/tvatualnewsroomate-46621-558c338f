import { useMemo, useState } from "react";
import { Pauta } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { PautaCard } from "./PautaCard";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PautasCalendarProps {
  pautas: Pauta[];
  onEdit: (p: Pauta) => void;
  onDelete: (p: Pauta) => void;
  onNewPautaForDate: (date: Date) => void;
}

export const PautasCalendar = ({ pautas, onEdit, onDelete, onNewPautaForDate }: PautasCalendarProps) => {
  const [selected, setSelected] = useState<Date>(new Date());

  const pautasByDay = useMemo(() => {
    const map = new Map<string, Pauta[]>();
    for (const p of pautas) {
      if (!p.data_cobertura) continue;
      try {
        const key = format(parseISO(p.data_cobertura), "yyyy-MM-dd");
        const arr = map.get(key) || [];
        arr.push(p);
        map.set(key, arr);
      } catch {}
    }
    return map;
  }, [pautas]);

  const daysWithPautas = useMemo(
    () => Array.from(pautasByDay.keys()).map((k) => parseISO(k)),
    [pautasByDay]
  );

  const dayKey = format(selected, "yyyy-MM-dd");
  const pautasOfDay = pautasByDay.get(dayKey) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 h-full min-h-0">
      <div className="flex flex-col items-start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && setSelected(d)}
          locale={ptBR}
          modifiers={{ hasPautas: daysWithPautas }}
          modifiersClassNames={{ hasPautas: "bg-primary/20 font-bold text-primary" }}
          className={cn("p-3 pointer-events-auto rounded-md border")}
        />
      </div>

      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="font-semibold">
            {format(selected, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <Button size="sm" onClick={() => onNewPautaForDate(selected)}>
            <Plus className="h-4 w-4 mr-1" /> Nova pauta neste dia
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {pautasOfDay.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma pauta para este dia.
            </p>
          ) : (
            pautasOfDay.map((p) => (
              <PautaCard key={p.id} pauta={p} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
