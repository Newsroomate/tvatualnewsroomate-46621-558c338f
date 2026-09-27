import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, FileDown, User, Calendar, MapPin, Phone, Send } from "lucide-react";
import { Pauta } from "@/types";
import { generatePautaPDF } from "@/utils/pdf-utils";
import { generatePautaWord } from "@/utils/word-export-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EnviarPautaEspelhoDialog } from "./EnviarPautaEspelhoDialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PautaCardProps {
  pauta: Pauta;
  onEdit: (pauta: Pauta) => void;
  onDelete: (pauta: Pauta) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, pauta: Pauta) => void;
}

export const PautaCard = ({ pauta, onEdit, onDelete, draggable, onDragStart }: PautaCardProps) => {
  const [espelhoOpen, setEspelhoOpen] = useState(false);
  const primeiroContato = pauta.entrevistados_contatos?.[0];
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handlePDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      generatePautaPDF(pauta);
    } catch (err) {
      console.error("Erro PDF:", err);
    }
  };

  const handleWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      generatePautaWord(pauta);
    } catch (err) {
      console.error("Erro Word:", err);
    }
  };

  return (
    <Card
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, pauta)}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-tight flex-1">{pauta.titulo}</h4>
        {pauta.programa && (
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {pauta.programa}
          </Badge>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {pauta.data_cobertura && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(pauta.data_cobertura)}</span>
          </div>
        )}
        {pauta.reporter && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate">{pauta.reporter}</span>
          </div>
        )}
        {pauta.local && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{pauta.local}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(pauta)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
            <DropdownMenuItem onClick={(e) => handlePDF(e as any)}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar como PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleWord(e as any)}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar como Word (.docx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(pauta)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
};
