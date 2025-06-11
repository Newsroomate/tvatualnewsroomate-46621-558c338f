
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Copy } from "lucide-react";
import { format } from "date-fns";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";

interface FullRundownHeaderProps {
  snapshot: ClosedRundownSnapshot;
  onBack: () => void;
  onRefresh: () => void;
  hybridError?: string | null;
  hasCopiedItem?: boolean;
}

export const FullRundownHeader = ({ 
  snapshot, 
  onBack, 
  onRefresh, 
  hybridError, 
  hasCopiedItem 
}: FullRundownHeaderProps) => {
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
      
      <div className="flex items-center space-x-2">
        {hasCopiedItem && (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center">
            <Copy className="h-3 w-3 mr-1" />
            <span>Matéria na área de transferência</span>
          </Badge>
        )}
        {hybridError && (
          <span className="text-sm text-red-600">Erro ao carregar alterações</span>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>
    </div>
  );
};
