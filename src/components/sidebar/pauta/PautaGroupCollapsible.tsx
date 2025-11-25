import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Pauta } from "@/types";
import { PautaCard } from "./PautaCard";

interface PautaGroupCollapsibleProps {
  title: string;
  pautas: Pauta[];
  defaultOpen?: boolean;
  onPrint: (pauta: Pauta, e: React.MouseEvent) => void;
  onDelete: (pauta: Pauta, e: React.MouseEvent) => void;
}

export const PautaGroupCollapsible = ({
  title,
  pautas,
  defaultOpen = true,
  onPrint,
  onDelete,
}: PautaGroupCollapsibleProps) => {
  if (pautas.length === 0) return null;

  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md transition-colors group">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
          <span className="text-xs font-semibold text-foreground/90">{title}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {pautas.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2 pl-2">
        {pautas.map((pauta) => (
          <PautaCard
            key={pauta.id}
            pauta={pauta}
            onPrint={onPrint}
            onDelete={onDelete}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
