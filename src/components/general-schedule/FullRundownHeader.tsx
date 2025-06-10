
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";

interface FullRundownHeaderProps {
  snapshot: ClosedRundownSnapshot;
  onBack: () => void;
}

export const FullRundownHeader = ({ snapshot, onBack }: FullRundownHeaderProps) => {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{snapshot.nome_telejornal}</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {format(new Date(snapshot.data_referencia), "dd/MM/yyyy")}
            </Badge>
            {snapshot.horario && (
              <Badge variant="secondary">
                {snapshot.horario}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
