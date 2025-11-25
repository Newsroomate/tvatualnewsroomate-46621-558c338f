import { FileText, Trash2, Calendar, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pauta } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PautaCardProps {
  pauta: Pauta;
  onPrint: (pauta: Pauta, e: React.MouseEvent) => void;
  onDelete: (pauta: Pauta, e: React.MouseEvent) => void;
}

export const PautaCard = ({ pauta, onPrint, onDelete }: PautaCardProps) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'concluida':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'em_producao':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'cancelada':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  const formatStatus = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'concluida': return 'Concluída';
      case 'em_producao': return 'Em Produção';
      case 'pendente': return 'Pendente';
      case 'cancelada': return 'Cancelada';
      default: return status || 'Pendente';
    }
  };

  return (
    <div className="group relative bg-background/50 hover:bg-muted/50 border border-border rounded-md p-2 transition-colors">
      <div className="flex flex-col gap-1.5">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-medium line-clamp-2 flex-1 leading-tight">
            {pauta.titulo}
          </h4>
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${getStatusColor(pauta.status)}`}
          >
            {formatStatus(pauta.status)}
          </Badge>
        </div>

        {/* Meta Info */}
        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
          {pauta.data_cobertura && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {format(new Date(pauta.data_cobertura), "dd MMM", { locale: ptBR })}
              </span>
            </div>
          )}
          
          {pauta.reporter && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{pauta.reporter}</span>
            </div>
          )}
          
          {pauta.local && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{pauta.local}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Show on hover */}
      <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5 bg-background/95 backdrop-blur-sm rounded border border-border shadow-sm p-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={e => onPrint(pauta, e)}
        >
          <FileText className="h-3 w-3" />
          <span className="sr-only">Imprimir PDF</span>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-destructive hover:text-destructive" 
          onClick={e => onDelete(pauta, e)}
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Excluir</span>
        </Button>
      </div>
    </div>
  );
};
